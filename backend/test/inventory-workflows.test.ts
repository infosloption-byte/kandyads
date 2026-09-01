import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let materialId = 0;
let requirementId = 0;
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
  if (requirementId) await prisma.materialRequirement.delete({ where: { id: requirementId } }).catch(() => undefined);
  if (movementIds.length) await prisma.stockMovement.deleteMany({ where: { id: { in: movementIds } } }).catch(() => undefined);
  if (materialId) await prisma.stockMovement.deleteMany({ where: { materialId } }).catch(() => undefined);
  if (materialId) await prisma.materialRequirement.deleteMany({ where: { materialId } }).catch(() => undefined);
  if (materialId) await prisma.material.delete({ where: { id: materialId } }).catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

test('inventory summary requires authentication', async () => {
  const response = await app.inject({ method: 'GET', url: `${base}/inventory/stock-summary` });
  assert.equal(response.statusCode, 401);
});

test('inventory reports reserved, available and reorder quantities', async () => {
  const warehouses = await request(`${base}/warehouses`);
  const jobs = await request(`${base}/jobs?pageSize=100`);
  assert.equal(warehouses.status, 200);
  assert.equal(jobs.status, 200);
  const warehouseId = warehouses.body.data[0]?.id;
  const job = jobs.body.data.find((item: any) => !['COMPLETED', 'CANCELLED'].includes(item.status));
  assert.ok(warehouseId);
  assert.ok(job);

  const created = await request(`${base}/materials`, {
    method: 'POST',
    body: JSON.stringify({
      sku: `TEST-INV-${Date.now()}`,
      name: 'Automated Inventory Workflow Material',
      unit: 'pcs',
      standardCost: 25,
      reorderLevel: 3,
      minimumStock: 1,
    }),
  });
  assert.equal(created.status, 201);
  materialId = created.body.data.id;

  for (const input of [
    { type: 'PURCHASE_RECEIPT', quantity: 10, unitCost: 25, reference: 'TEST-RECEIPT' },
    { type: 'ISSUE', quantity: 4, unitCost: 25, reference: 'TEST-ISSUE' },
    { type: 'WASTE', quantity: 1, unitCost: 25, reference: 'TEST-WASTE' },
  ]) {
    const movement = await request(`${base}/stock-movements`, {
      method: 'POST',
      body: JSON.stringify({ materialId, warehouseId, ...input }),
    });
    assert.equal(movement.status, 201);
    movementIds.push(movement.body.data.id);
  }

  const requirement = await request(`${base}/jobs/${job.id}/material-requirements`, {
    method: 'POST',
    body: JSON.stringify({ materialId, requiredQty: 4, reservedQty: 3 }),
  });
  assert.equal(requirement.status, 201);
  requirementId = requirement.body.data.id;

  const summary = await request(`${base}/inventory/stock-summary`);
  assert.equal(summary.status, 200);
  const row = summary.body.data.find((item: any) => item.id === materialId);
  assert.ok(row);
  assert.equal(row.stockOnHand, 5);
  assert.equal(row.reservedQty, 3);
  assert.equal(row.availableQty, 2);
  assert.equal(row.reorderAlert, true);
  const warehouseRow = row.warehouses.find((item: any) => item.id === warehouseId);
  assert.ok(warehouseRow);
  assert.equal(warehouseRow.quantity, 5);

  const alerts = await request(`${base}/inventory/reorder-alerts`);
  assert.equal(alerts.status, 200);
  assert.ok(alerts.body.data.some((item: any) => item.id === materialId));
});

test('stock ledger supports filtering, pagination and signed quantities', async () => {
  const ledger = await request(`${base}/stock-movements?materialId=${materialId}&page=1&pageSize=2`);
  assert.equal(ledger.status, 200);
  assert.equal(ledger.body.meta.page, 1);
  assert.equal(ledger.body.meta.pageSize, 2);
  assert.equal(ledger.body.meta.total, movementIds.length);
  assert.equal(ledger.body.meta.totalPages, Math.ceil(movementIds.length / 2));
  assert.equal(ledger.body.data.length, 2);
  assert.ok(ledger.body.data.every((row: any) => typeof row.signedQuantity === 'number'));
  assert.ok(ledger.body.data.some((row: any) => row.signedQuantity < 0));

  const issueOnly = await request(`${base}/stock-movements?materialId=${materialId}&type=ISSUE&pageSize=50`);
  assert.equal(issueOnly.status, 200);
  assert.equal(issueOnly.body.data.length, 1);
  assert.equal(issueOnly.body.data[0].signedQuantity, -4);

  const invalid = await request(`${base}/stock-movements?pageSize=0`);
  assert.equal(invalid.status, 400);
});

test('stock movement validates related records and preserves transaction side effects', async () => {
  const warehouse = await request(`${base}/warehouses`);
  assert.equal(warehouse.status, 200);
  const warehouseId = warehouse.body.data[0]?.id;
  assert.ok(warehouseId);

  const before = await prisma.stockMovement.count({ where: { materialId } });
  const missingMaterial = await request(`${base}/stock-movements`, {
    method: 'POST',
    body: JSON.stringify({ materialId: 999999999, warehouseId, type: 'PURCHASE_RECEIPT', quantity: 1 }),
  });
  assert.equal(missingMaterial.status, 404);
  assert.equal(await prisma.stockMovement.count({ where: { materialId } }), before);

  const missingProject = await request(`${base}/stock-movements`, {
    method: 'POST',
    body: JSON.stringify({ materialId, warehouseId, projectId: 999999999, type: 'PURCHASE_RECEIPT', quantity: 1 }),
  });
  assert.equal(missingProject.status, 400);
  assert.equal(await prisma.stockMovement.count({ where: { materialId } }), before);
});
