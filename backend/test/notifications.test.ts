import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

let app: ReturnType<typeof buildApp>;
let token = '';
let userId = 0;
let notificationId = 0;

async function req(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  return app.inject({
    method: (init.method ?? 'GET') as any,
    url,
    headers: Object.fromEntries(headers.entries()),
    payload: init.body,
  });
}

before(async () => {
  if (!process.env.KANDYADS_TEST_MODE) {
    throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  }

  app = buildApp();
  await app.ready();

  const login = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({
      email: 'admin@kandyads.lk',
      password: 'ChangeMe!123',
    }),
  });

  assert.equal(login.statusCode, 200);

  const body = JSON.parse(login.body);
  token = body.data.token;
  userId = Number(body.data.user.id);
  assert.ok(Number.isSafeInteger(userId) && userId > 0);

  const fixtureId = await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      DELETE FROM Notification
      WHERE dedupeKey = 'TEST:NOTIFICATION:1'
    `;

    await tx.$executeRaw`
      INSERT INTO Notification (userId, type, title, message, dedupeKey)
      VALUES (
        ${userId},
        'JOB_ASSIGNMENT',
        'Test assignment',
        'You have a test assignment.',
        'TEST:NOTIFICATION:1'
      )
    `;

    const rows = await tx.$queryRaw<{ id: bigint }[]>`
      SELECT id
      FROM Notification
      WHERE userId = ${userId}
        AND dedupeKey = 'TEST:NOTIFICATION:1'
    `;

    assert.equal(rows.length, 1);
    return Number(rows[0].id);
  });

  assert.ok(Number.isSafeInteger(fixtureId) && fixtureId > 0);
  notificationId = fixtureId;
});

after(async () => {
  if (userId) {
    await prisma.$executeRaw`
      DELETE FROM Notification
      WHERE dedupeKey = 'TEST:NOTIFICATION:1'
    `;
  }

  await app.close();
  await prisma.$disconnect();
});

test('notification list is authenticated and returns unread count', async () => {
  const response = await req('/api/v1/notifications?unreadOnly=true');
  assert.equal(response.statusCode, 200);

  const body = JSON.parse(response.body);
  assert.equal(body.meta.unreadCount, 1);
  assert.equal(body.data[0].type, 'JOB_ASSIGNMENT');
});

test('notification read is scoped to the authenticated user', async () => {
  const response = await req(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
  });
  assert.equal(response.statusCode, 200, response.body);

  const list = await req('/api/v1/notifications?unreadOnly=true');
  assert.equal(JSON.parse(list.body).meta.unreadCount, 0);
});

test('invalid notification id is rejected', async () => {
  const response = await req('/api/v1/notifications/not-an-id/read', {
    method: 'POST',
  });
  assert.equal(response.statusCode, 400);
});

test('notification endpoints reject unauthenticated requests', async () => {
  const saved = token;
  token = '';

  try {
    const response = await req('/api/v1/notifications');
    assert.equal(response.statusCode, 401);
  } finally {
    token = saved;
  }
});
