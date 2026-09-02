import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { createPasswordHash } from '../src/modules/auth/auth.routes.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let adminToken = '';
let limitedToken = '';
let limitedUserId = 0;
let limitedRoleId = 0;
let movementId = 0;
let invoiceId = 0;
let invoicePaymentId = 0;
const limitedEmail = `audit-limited-${Date.now()}@kandyads.lk`;
const invoiceNumber = `INV-AUDIT-${Date.now()}`;

async function request(path: string, options: RequestInit = {}, authToken = adminToken) {
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (authToken) headers.set('authorization', `Bearer ${authToken}`);
  const response = await app.inject({ method: (options.method ?? 'GET') as any, url: path, headers: Object.fromEntries(headers.entries()), payload: options.body });
  const body = response.body ? JSON.parse(response.body) : {};
  assert.ok(response.statusCode < 500, `${response.statusCode}: ${response.body}`);
  return { status: response.statusCode, body };
}

async function login(email: string, password: string) {
  const response = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email, password }) });
  assert.equal(response.statusCode, 200);
  return JSON.parse(response.body).data.token as string;
}

before(async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Tests must not run against production');
  if (!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app = buildApp();
  await app.ready();

  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrator' } });
  assert.ok(adminRole);
  const auditPermission = await prisma.permission.upsert({ where: { key: 'audit.read' }, update: {}, create: { key: 'audit.read', description: 'Permission: audit.read' } });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: auditPermission.id } },
    update: {},
    create: { roleId: adminRole.id, permissionId: auditPermission.id },
  });
  adminToken = await login('admin@kandyads.lk', 'ChangeMe!123');

  const limitedRole = await prisma.role.create({ data: { name: `Audit Limited ${Date.now()}` } });
  limitedRoleId = limitedRole.id;
  const limitedUser = await prisma.user.create({ data: { name: 'Audit Limited User', email: limitedEmail, passwordHash: createPasswordHash('Original!123'), roleId: limitedRole.id, status: 'ACTIVE' } });
  limitedUserId = limitedUser.id;
  limitedToken = await login(limitedEmail, 'Original!123');
});

after(async () => {
  if (invoicePaymentId) await prisma.payment.delete({ where: { id: invoicePaymentId } }).catch(() => undefined);
  if (invoiceId) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } }).catch(() => undefined);
    await prisma.invoice.delete({ where: { id: invoiceId } }).catch(() => undefined);
  }
  if (movementId) {
    await prisma.auditLog.deleteMany({ where: { entity: 'StockMovement', entityId: String(movementId) } }).catch(() => undefined);
    await prisma.stockMovement.delete({ where: { id: movementId } }).catch(() => undefined);
  }
  if (limitedUserId) await prisma.user.delete({ where: { id: limitedUserId } }).catch(() => undefined);
  if (limitedRoleId) await prisma.role.delete({ where: { id: limitedRoleId } }).catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

test('audit log endpoint requires audit permission and supports filters', async () => {
  const denied = await request(`${base}/audit-logs`, {}, limitedToken);
  assert.equal(denied.status, 403);
  assert.match(denied.body.error.message, /audit\.read/i);

  const response = await request(`${base}/audit-logs?page=1&pageSize=5`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.data));
  assert.equal(response.body.meta.page, 1);
  assert.equal(response.body.meta.pageSize, 5);
});

test('stock movement and audit record commit together', async () => {
  const material = await prisma.material.findFirst({ orderBy: { id: 'asc' } });
  const warehouse = await prisma.warehouse.findFirst({ orderBy: { id: 'asc' } });
  assert.ok(material && warehouse);

  const response = await request(`${base}/stock-movements`, {
    method: 'POST',
    body: JSON.stringify({ materialId: material.id, warehouseId: warehouse.id, type: 'ADJUSTMENT', quantity: 1.25, unitCost: 100, reference: `AUDIT-${Date.now()}` }),
  });
  assert.equal(response.status, 201);
  movementId = response.body.data.id;

  const audit = await prisma.auditLog.findFirst({ where: { entity: 'StockMovement', entityId: String(movementId), action: 'STOCK_MOVEMENT_CREATED' } });
  assert.ok(audit);
  assert.equal((audit.afterJson as { type?: string; quantity?: number }).type, 'ADJUSTMENT');
});

test('invoice creation and payment persist financial history with before/after values', async () => {
  const client = await prisma.client.findFirst({ orderBy: { id: 'asc' } });
  assert.ok(client);

  const created = await request(`${base}/invoices`, {
    method: 'POST',
    body: JSON.stringify({
      number: invoiceNumber,
      clientId: client.id,
      invoiceDate: '2026-09-02T00:00:00.000Z',
      dueDate: '2026-09-16T00:00:00.000Z',
      subtotal: 1000,
      discount: 0,
      tax: 0,
      total: 1000,
      status: 'ISSUED',
      items: [{ description: 'Audit test item', quantity: 1, unit: 'Job', rate: 1000, total: 1000 }],
    }),
  });
  assert.equal(created.status, 201);
  invoiceId = created.body.data.id;

  const invoiceAudit = await prisma.auditLog.findFirst({ where: { entity: 'Invoice', entityId: String(invoiceId), action: 'INVOICE_CREATED' } });
  assert.ok(invoiceAudit);
  assert.equal(Number((invoiceAudit.afterJson as { total: number }).total), 1000);

  const paid = await request(`${base}/payments`, {
    method: 'POST',
    body: JSON.stringify({ invoiceId, amount: 250, paidAt: '2026-09-02T00:00:00.000Z', method: 'BANK_TRANSFER', reference: 'AUDIT-PAYMENT' }),
  });
  assert.equal(paid.status, 201);
  invoicePaymentId = paid.body.data.payment.id;

  const paymentAudit = await prisma.auditLog.findFirst({ where: { entity: 'Invoice', entityId: String(invoiceId), action: 'PAYMENT_POSTED' } });
  assert.ok(paymentAudit);
  assert.equal(Number((paymentAudit.beforeJson as { amountPaid: number }).amountPaid), 0);
  assert.equal(Number((paymentAudit.afterJson as { amountPaid: number }).amountPaid), 250);
  assert.equal(Number((paymentAudit.afterJson as { balance: number }).balance), 750);
});

test('invalid financial and inventory references do not create audit records', async () => {
  const stock = await request(`${base}/stock-movements`, {
    method: 'POST',
    body: JSON.stringify({ materialId: 999999999, warehouseId: 999999999, type: 'ADJUSTMENT', quantity: 1 }),
  });
  assert.equal(stock.status, 404);
  const stockAudit = await prisma.auditLog.count({ where: { entity: 'StockMovement', entityId: '999999999', action: 'STOCK_MOVEMENT_CREATED' } });
  assert.equal(stockAudit, 0);

  const payment = await request(`${base}/payments`, {
    method: 'POST',
    body: JSON.stringify({ invoiceId: 999999999, amount: 10, paidAt: '2026-09-02T00:00:00.000Z', method: 'CASH' }),
  });
  assert.equal(payment.status, 404);
  const paymentAudit = await prisma.auditLog.count({ where: { entity: 'Invoice', entityId: '999999999', action: 'PAYMENT_POSTED' } });
  assert.equal(paymentAudit, 0);
});
