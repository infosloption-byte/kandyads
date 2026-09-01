import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';
let clientId = 0;
let employeeId = 0;
let projectId = 0;
let jobId = 0;
let taskId = 0;
let materialId = 0;
let warehouseId = 0;
let vendorId = 0;
let quoteId = 0;
let invoiceId = 0;

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
  if (!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 and point DATABASE_URL to a test database before running the integration suite.');
  app = buildApp();
  await app.ready();
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test('health and API root', async () => {
  const health = await app.inject('/health');
  assert.equal(health.statusCode, 200);
  const root = await app.inject(`${base}`);
  assert.equal(root.statusCode, 200);
});

test('auth login and session', async () => {
  const result = await request(`${base}/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(result.status, 200);
  assert.ok(result.body.data.token);
  token = result.body.data.token;
  const me = await request(`${base}/auth/me`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.email, 'admin@kandyads.lk');
});

test('dashboard', async () => {
  const result = await request(`${base}/dashboard/summary`);
  assert.equal(result.status, 200);
  assert.ok(result.body.data);
});

test('CRM modules expose seeded data', async () => {
  const clients = await request(`${base}/clients?pageSize=5`);
  assert.equal(clients.status, 200);
  clientId = clients.body.data[0]?.id ?? 0;
  assert.ok(clientId);
  const leads = await request(`${base}/leads?pageSize=5`);
  const enquiries = await request(`${base}/enquiries?pageSize=5`);
  const quotes = await request(`${base}/quotes?pageSize=5`);
  assert.equal(leads.status, 200);
  assert.equal(enquiries.status, 200);
  assert.equal(quotes.status, 200);
  quoteId = quotes.body.data[0]?.id ?? 0;
});

test('delivery and team modules expose seeded data', async () => {
  const employees = await request(`${base}/employees?pageSize=100`);
  const projects = await request(`${base}/projects?pageSize=100`);
  const jobs = await request(`${base}/jobs?pageSize=100`);
  const tasks = await request(`${base}/tasks?pageSize=100`);
  const time = await request(`${base}/time?pageSize=100`);
  assert.equal(employees.status, 200);
  assert.equal(projects.status, 200);
  assert.equal(jobs.status, 200);
  assert.equal(tasks.status, 200);
  assert.equal(time.status, 200);
  employeeId = employees.body.data[0]?.id ?? 0;
  projectId = projects.body.data[0]?.id ?? 0;
  jobId = jobs.body.data[0]?.id ?? 0;
  taskId = tasks.body.data.find((t: any) => t.jobId === jobId)?.id ?? tasks.body.data[0]?.id ?? 0;
  assert.ok(employeeId && projectId && jobId && taskId);
});

test('task workflow validation and completion process', async () => {
  const detail = await request(`${base}/tasks/${taskId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.id, taskId);

  const invalid = await request(`${base}/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'NOT_A_STATUS' }) });
  assert.equal(invalid.status, 400);

  const completed = await request(`${base}/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.data.status, 'COMPLETED');
  assert.ok(completed.body.data.completedAt);
});

test('materials, inventory and vendors', async () => {
  const materials = await request(`${base}/materials`);
  const warehouses = await request(`${base}/warehouses`);
  const vendors = await request(`${base}/vendors?pageSize=100`);
  assert.equal(materials.status, 200);
  assert.equal(warehouses.status, 200);
  assert.equal(vendors.status, 200);
  materialId = materials.body.data[0]?.id ?? 0;
  warehouseId = warehouses.body.data[0]?.id ?? 0;
  vendorId = vendors.body.data[0]?.id ?? 0;
  assert.ok(materialId && warehouseId && vendorId);
  const movements = await request(`${base}/stock-movements?materialId=${materialId}&warehouseId=${warehouseId}`);
  assert.equal(movements.status, 200);
});

test('outsourcing, expenses and purchasing', async () => {
  const outsourcing = await request(`${base}/outsourcing?pageSize=100`);
  const expenses = await request(`${base}/expenses?pageSize=100`);
  const expenseCategories = await request(`${base}/expense-categories?pageSize=100`);
  const purchaseRequests = await request(`${base}/purchase-requests?pageSize=100`);
  const purchaseOrders = await request(`${base}/purchase-orders?pageSize=100`);
  const goodsReceipts = await request(`${base}/goods-receipts?pageSize=100`);
  assert.equal(outsourcing.status, 200);
  assert.equal(expenses.status, 200);
  assert.equal(expenseCategories.status, 200);
  assert.equal(purchaseRequests.status, 200);
  assert.equal(purchaseOrders.status, 200);
  assert.equal(goodsReceipts.status, 200);
});

test('field operations and finance', async () => {
  const installations = await request(`${base}/installations?pageSize=100`);
  const invoices = await request(`${base}/invoices?pageSize=100`);
  const payments = await request(`${base}/payments?pageSize=100`);
  assert.equal(installations.status, 200);
  assert.equal(invoices.status, 200);
  assert.equal(payments.status, 200);
  invoiceId = invoices.body.data[0]?.id ?? 0;
  assert.ok(invoiceId);
});

test('profitability and detail endpoints', async () => {
  const summary = await request(`${base}/profitability/summary`);
  const projects = await request(`${base}/profitability/projects`);
  const jobs = await request(`${base}/profitability/jobs`);
  const job = await request(`${base}/profitability/jobs/${jobId}`);
  const project = await request(`${base}/projects/${projectId}`);
  const jobDetail = await request(`${base}/jobs/${jobId}`);
  const client = await request(`${base}/clients/${clientId}`);
  assert.equal(summary.status, 200);
  assert.equal(projects.status, 200);
  assert.equal(jobs.status, 200);
  assert.equal(job.status, 200);
  assert.equal(project.status, 200);
  assert.equal(jobDetail.status, 200);
  assert.equal(client.status, 200);
});
