import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let materialId = 0;
let warehouseId = 0;
const movementIds: number[] = [];

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
  const warehouses = await request(`${base}/warehouses`);
  assert.equal(warehouses.status, 200);
  warehouseId = warehouses.body.data[0]?.id;
  assert.ok(warehouseId);
  const material = await request(`${base}/materials`, { method: 'POST', body: JSON.stringify({ sku: `TEST-STOCK-RULE-${Date.now()}`, name: 'Stock Movement Rule Test Material', unit: 'pcs', standardCost: 20, reorderLevel: 2, minimumStock: 0 }) });
  assert.equal(material.status, 201);
  materialId = material.body.data.id;
});

after(async () => {
  if (movementIds.length) await prisma.stockMovement.deleteMany({ where: { id: { in: movementIds } } }).catch(() => undefined);
  if (materialId) await prisma.material.delete({ where: { id: materialId } }).catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

test('stock movement signs each movement type correctly', async () => {
  const inputs = [
    ['PURCHASE_RECEIPT', 10, 10],
    ['ISSUE', 3, -3],
    ['RETURN', 2, 2],
    ['TRANSFER', 4, 0],
    ['ADJUSTMENT', 1.5, 1.5],
    ['WASTE', 0.5, -0.5],
  ] as const;
  for (const [type, quantity, expected] of inputs) {
    const response = await request(`${base}/stock-movements`, { method: 'POST', body: JSON.stringify({ materialId, warehouseId, type, quantity, unitCost: 20, reference: `RULE-${type}` }) });
    assert.equal(response.status, 201);
    movementIds.push(response.body.data.id);
    const ledger = await request(`${base}/stock-movements?reference=RULE-${type}&pageSize=10`);
    assert.equal(ledger.status, 200);
    assert.equal(ledger.body.data[0].signedQuantity, expected);
  }
});

test('stock movement rejects invalid quantities and missing related records without creating a row', async () => {
  const before = await prisma.stockMovement.count({ where: { materialId } });
  const invalidQuantity = await request(`${base}/stock-movements`, { method: 'POST', body: JSON.stringify({ materialId, warehouseId, type: 'ISSUE', quantity: 0 }) });
  assert.equal(invalidQuantity.status, 400);
  const missingWarehouse = await request(`${base}/stock-movements`, { method: 'POST', body: JSON.stringify({ materialId, warehouseId: 999999999, type: 'ISSUE', quantity: 1 }) });
  assert.equal(missingWarehouse.status, 404);
  const missingJob = await request(`${base}/stock-movements`, { method: 'POST', body: JSON.stringify({ materialId, warehouseId, jobId: 999999999, type: 'ISSUE', quantity: 1 }) });
  assert.equal(missingJob.status, 400);
  assert.equal(await prisma.stockMovement.count({ where: { materialId } }), before);
});
