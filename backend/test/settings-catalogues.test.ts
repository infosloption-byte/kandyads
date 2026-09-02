import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let paymentMethodId = 0;
let unitId = 0;
let categoryId = 0;

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
});

after(async () => {
  if (categoryId) await prisma.expenseCategory.delete({ where: { id: categoryId } }).catch(() => undefined);
  if (unitId) await prisma.$executeRaw`DELETE FROM UnitOfMeasure WHERE id = ${unitId}`.catch(() => undefined);
  if (paymentMethodId) await prisma.$executeRaw`DELETE FROM PaymentMethodSetting WHERE id = ${paymentMethodId}`.catch(() => undefined);
  await prisma.$disconnect();
  await app.close();
});

test('settings catalogues require authentication', async () => {
  for (const path of [`${base}/settings/tax`, `${base}/settings/payment-methods`, `${base}/settings/units`, `${base}/expense-categories`]) {
    const response = await app.inject({ method: 'GET', url: path });
    assert.equal(response.statusCode, 401);
  }
});

test('tax setting validates, persists and returns normalized rate', async () => {
  const invalid = await request(`${base}/settings/tax`, { method: 'PUT', body: JSON.stringify({ name: 'VAT', rate: 101 }) });
  assert.equal(invalid.status, 400);

  const saved = await request(`${base}/settings/tax`, { method: 'PUT', body: JSON.stringify({ name: 'VAT', rate: 18, inclusive: false, active: true }) });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.rate, 18);

  const fetched = await request(`${base}/settings/tax`);
  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.data.name, 'VAT');
  assert.equal(fetched.body.data.rate, 18);
});

test('payment methods and units validate duplicates and update records', async () => {
  const invalidPayment = await request(`${base}/settings/payment-methods`, { method: 'POST', body: JSON.stringify({ name: 'C', code: 'C' }) });
  assert.equal(invalidPayment.status, 400);

  const payment = await request(`${base}/settings/payment-methods`, { method: 'POST', body: JSON.stringify({ name: `Test Bank ${Date.now()}`, code: `TEST-BANK-${Date.now()}`, sortOrder: 10 }) });
  assert.equal(payment.status, 201);
  paymentMethodId = payment.body.data.id;

  const duplicatePayment = await request(`${base}/settings/payment-methods`, { method: 'POST', body: JSON.stringify({ name: payment.body.data.name, code: `OTHER-${Date.now()}` }) });
  assert.equal(duplicatePayment.status, 409);

  const updatedPayment = await request(`${base}/settings/payment-methods/${paymentMethodId}`, { method: 'PATCH', body: JSON.stringify({ active: false }) });
  assert.equal(updatedPayment.status, 200);
  assert.equal(Number(updatedPayment.body.data.active), 0);

  const unit = await request(`${base}/settings/units`, { method: 'POST', body: JSON.stringify({ name: `Test Unit ${Date.now()}`, code: `TU${Date.now().toString().slice(-6)}` }) });
  assert.equal(unit.status, 201);
  unitId = unit.body.data.id;

  const duplicateUnit = await request(`${base}/settings/units`, { method: 'POST', body: JSON.stringify({ name: unit.body.data.name, code: `X${Date.now()}` }) });
  assert.equal(duplicateUnit.status, 409);

  const updatedUnit = await request(`${base}/settings/units/${unitId}`, { method: 'PATCH', body: JSON.stringify({ active: false }) });
  assert.equal(updatedUnit.status, 200);
  assert.equal(Number(updatedUnit.body.data.active), 0);
});

test('expense categories support create, duplicate protection, missing-record validation and update', async () => {
  const invalid = await request(`${base}/expense-categories`, { method: 'POST', body: JSON.stringify({ name: '' }) });
  assert.equal(invalid.status, 400);

  const category = await request(`${base}/expense-categories`, { method: 'POST', body: JSON.stringify({ name: `Test Expense Category ${Date.now()}` }) });
  assert.equal(category.status, 201);
  categoryId = category.body.data.id;

  const duplicate = await request(`${base}/expense-categories`, { method: 'POST', body: JSON.stringify({ name: category.body.data.name }) });
  assert.equal(duplicate.status, 409);

  const missing = await request(`${base}/expense-categories/999999999`, { method: 'PATCH', body: JSON.stringify({ name: 'Missing Category' }) });
  assert.equal(missing.status, 404);

  const updated = await request(`${base}/expense-categories/${categoryId}`, { method: 'PATCH', body: JSON.stringify({ name: `Updated Expense Category ${Date.now()}` }) });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.id, categoryId);
});
