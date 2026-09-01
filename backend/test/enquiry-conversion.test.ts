import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let clientId = 0;
let enquiryId = 0;
let quoteId = 0;

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await app.inject({ method: (options.method ?? 'GET') as any, url: path, headers: Object.fromEntries(headers.entries()), payload: options.body });
  const body = response.body ? JSON.parse(response.body) : {};
  assert.ok(response.statusCode < 500, `${response.statusCode}: ${response.body}`);
  return { status: response.statusCode, body };
}

before(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Tests must not run against production');
  if (!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app = buildApp();
  await app.ready();
  const login = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(login.statusCode, 200);
  token = JSON.parse(login.body).data.token;
  const client = await prisma.client.findFirst({ orderBy: { id: 'asc' } });
  assert.ok(client);
  clientId = client.id;
});

after(async () => {
  if (quoteId) {
    await prisma.auditLog.deleteMany({ where: { entity: 'Enquiry', entityId: String(enquiryId) } }).catch(() => undefined);
    await prisma.quote.delete({ where: { id: quoteId } }).catch(() => undefined);
  }
  if (enquiryId) await prisma.enquiry.delete({ where: { id: enquiryId } }).catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

test('enquiry to quote conversion requires authentication', async () => {
  const response = await app.inject({ method: 'POST', url: `${base}/enquiries/999999/convert-to-quote`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ items: [{ description: 'Test', quantity: 1, unit: 'job', rate: 100 }] }) });
  assert.equal(response.statusCode, 401);
});

test('enquiry to quote conversion validates quote items', async () => {
  const enquiry = await prisma.enquiry.create({ data: { number: `TEST-ENQ-${Date.now()}`, clientId, requirement: 'Validation test enquiry', status: 'OPEN' } });
  enquiryId = enquiry.id;
  const response = await request(`${base}/enquiries/${enquiry.id}/convert-to-quote`, { method: 'POST', body: JSON.stringify({ items: [] }) });
  assert.equal(response.status, 400);
  await prisma.enquiry.delete({ where: { id: enquiry.id } });
  enquiryId = 0;
});

test('enquiry to quote conversion handles missing enquiry', async () => {
  const response = await request(`${base}/enquiries/999999/convert-to-quote`, { method: 'POST', body: JSON.stringify({ items: [{ description: 'Test', quantity: 1, unit: 'job', rate: 100 }] }) });
  assert.equal(response.status, 404);
});

test('open enquiry converts to quote, moves to quoting and audits the side effect', async () => {
  const enquiry = await prisma.enquiry.create({ data: { number: `TEST-ENQ-${Date.now()}`, clientId, requirement: 'Large fascia sign and installation', status: 'OPEN' } });
  enquiryId = enquiry.id;

  const converted = await request(`${base}/enquiries/${enquiry.id}/convert-to-quote`, {
    method: 'POST',
    body: JSON.stringify({
      number: `TEST-QT-${Date.now()}`,
      expectedMaterial: 100,
      expectedLabour: 50,
      expectedOutsource: 25,
      expectedExpense: 10,
      items: [{ description: enquiry.requirement, quantity: 2, unit: 'pcs', rate: 200, discount: 10, tax: 15 }],
    }),
  });

  assert.equal(converted.status, 201);
  quoteId = converted.body.data.id;
  assert.equal(converted.body.data.clientId, clientId);
  assert.equal(converted.body.data.enquiryId, enquiry.id);
  assert.equal(Number(converted.body.data.total), 405);
  assert.equal(converted.body.data.items.length, 1);
  assert.equal(converted.body.data.items[0].description, enquiry.requirement);

  const updatedEnquiry = await prisma.enquiry.findUnique({ where: { id: enquiry.id } });
  assert.equal(updatedEnquiry?.status, 'QUOTING');

  const audit = await request(`${base}/approvals/audit?entity=Enquiry&entityId=${enquiry.id}&action=CONVERT_TO_QUOTE`);
  assert.equal(audit.status, 200);
  assert.equal(audit.body.data.length, 1);
  assert.equal(audit.body.data[0].action, 'CONVERT_TO_QUOTE');

  const duplicate = await request(`${base}/enquiries/${enquiry.id}/convert-to-quote`, {
    method: 'POST',
    body: JSON.stringify({ items: [{ description: 'Duplicate', quantity: 1, unit: 'job', rate: 100 }] }),
  });
  assert.equal(duplicate.status, 409);
});
