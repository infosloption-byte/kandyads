import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let projectId = 0;

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await app.inject({
    method: (options.method ?? 'GET') as any,
    url: path,
    headers: Object.fromEntries(headers.entries()),
    payload: options.body,
  });
  const body = response.body ? JSON.parse(response.body) : {};
  assert.ok(response.statusCode < 500, `${response.statusCode}: ${response.body}`);
  return { status: response.statusCode, body };
}

before(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Tests must not run against production');
  if (!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app = buildApp();
  await app.ready();
  const login = await app.inject({
    method: 'POST',
    url: `${base}/auth/login`,
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }),
  });
  assert.equal(login.statusCode, 200);
  token = JSON.parse(login.body).data.token;
});

after(async () => {
  if (projectId) {
    await prisma.auditLog.deleteMany({ where: { entity: 'Project', entityId: String(projectId) } }).catch(() => undefined);
    await prisma.project.delete({ where: { id: projectId } }).catch(() => undefined);
  }
  await app.close();
  await prisma.$disconnect();
});

test('project edit, status rules and activity history workflow', async () => {
  const client = await prisma.client.findFirst({ orderBy: { id: 'asc' } });
  assert.ok(client);

  const unauthorized = await app.inject({ method: 'GET', url: `${base}/projects` });
  assert.equal(unauthorized.statusCode, 401);

  const created = await request(`${base}/projects`, {
    method: 'POST',
    body: JSON.stringify({
      number: `TEST-PROJECT-${Date.now()}`,
      name: 'Automated Project Workflow',
      clientId: client.id,
      value: 25000,
    }),
  });
  assert.equal(created.status, 201);
  projectId = created.body.data.id;
  assert.equal(created.body.data.status, 'PLANNED');

  const missingClient = await request(`${base}/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ clientId: 999999999 }),
  });
  assert.equal(missingClient.status, 400);
  assert.match(missingClient.body.error.message, /Client not found/i);

  const edited = await request(`${base}/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Automated Project Workflow Updated', value: 27500 }),
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.name, 'Automated Project Workflow Updated');
  assert.equal(Number(edited.body.data.value), 27500);

  const active = await request(`${base}/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  assert.equal(active.status, 200);

  const invalidRollback = await request(`${base}/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'PLANNED' }),
  });
  assert.equal(invalidRollback.status, 400);
  assert.match(invalidRollback.body.error.message, /Invalid project transition/i);

  const onHold = await request(`${base}/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ON_HOLD' }),
  });
  assert.equal(onHold.status, 200);

  const resumed = await request(`${base}/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  assert.equal(resumed.status, 200);

  const cancelled = await request(`${base}/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
  assert.equal(cancelled.status, 200);

  const terminalEdit = await request(`${base}/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Should Not Change' }),
  });
  assert.equal(terminalEdit.status, 400);
  assert.match(terminalEdit.body.error.message, /cannot be edited from CANCELLED/i);

  const activity = await request(`${base}/projects/${projectId}/activity`);
  assert.equal(activity.status, 200);
  assert.ok(activity.body.data.length >= 5);
  assert.ok(activity.body.data.some((entry: any) => entry.action === 'CREATE'));
  assert.ok(activity.body.data.some((entry: any) => entry.action === 'UPDATE'));
  assert.ok(activity.body.data.some((entry: any) => entry.action === 'STATUS_CHANGE'));
  assert.ok(activity.body.data.every((entry: any) => String(entry.entityId) === String(projectId)));
});
