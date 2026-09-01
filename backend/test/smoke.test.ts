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
let testRoleId = 0;
let testUserId = 0;

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
});

after(async () => {
  if (testUserId) await prisma.user.delete({ where: { id: testUserId } }).catch(() => undefined);
  if (testRoleId) await prisma.role.delete({ where: { id: testRoleId } }).catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

test('health and API root', async () => {
  const health = await app.inject('/health');
  assert.equal(health.statusCode, 200);
  const root = await app.inject(`${base}`);
  assert.equal(root.statusCode, 200);
});

test('protected API requires authentication', async () => {
  const response = await app.inject({ method: 'GET', url: `${base}/clients` });
  assert.equal(response.statusCode, 401);
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

test('permission boundary rejects restricted role', async () => {
  const login = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email: 'kasun@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(login.statusCode, 200);
  const restrictedToken = JSON.parse(login.body).data.token;
  const response = await app.inject({ method: 'GET', url: `${base}/clients`, headers: { authorization: `Bearer ${restrictedToken}` } });
  assert.equal(response.statusCode, 403);
});

test('dashboard', async () => {
  const result = await request(`${base}/dashboard/summary`);
  assert.equal(result.status, 200);
  assert.ok(result.body.data);
});

test('settings user and role administration', async () => {
  const roles = await request(`${base}/settings/roles`);
  const permissions = await request(`${base}/settings/permissions`);
  const users = await request(`${base}/settings/users`);
  assert.equal(roles.status, 200);
  assert.equal(permissions.status, 200);
  assert.equal(users.status, 200);
  assert.ok(roles.body.data.length > 0);
  assert.ok(permissions.body.data.length > 0);
  const role = await request(`${base}/settings/roles`, { method: 'POST', body: JSON.stringify({ name: `Automated Test Role ${Date.now()}` }) });
  assert.equal(role.status, 201);
  testRoleId = role.body.data.id;
  const permissionIds = permissions.body.data.slice(0, 2).map((permission: any) => permission.id);
  const rolePermissions = await request(`${base}/settings/roles/${testRoleId}/permissions`, { method: 'PUT', body: JSON.stringify({ permissionIds }) });
  assert.equal(rolePermissions.status, 200);
  assert.equal(rolePermissions.body.data.permissions.length, permissionIds.length);
  const email = `admin-test-${Date.now()}@kandyads.local`;
  const user = await request(`${base}/settings/users`, { method: 'POST', body: JSON.stringify({ name: 'Automated Test User', email, password: 'TestPass!123', roleId: testRoleId }) });
  assert.equal(user.status, 201);
  testUserId = user.body.data.id;
  assert.equal(user.body.data.roleId, testRoleId);
  const deactivated = await request(`${base}/settings/users/${testUserId}`, { method: 'PATCH', body: JSON.stringify({ status: 'INACTIVE' }) });
  assert.equal(deactivated.status, 200);
  assert.equal(deactivated.body.data.status, 'INACTIVE');
  const userLogin = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email, password: 'TestPass!123' }) });
  assert.equal(userLogin.statusCode, 401);
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

test('business workflow blocks invalid quote, job and project transitions', async () => {
  const acceptedQuote = await request(`${base}/quotes/${quoteId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'SENT' }) });
  assert.equal(acceptedQuote.status, 400);

  const incompleteJob = await request(`${base}/jobs/${jobId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
  assert.equal(incompleteJob.status, 400);
  assert.match(incompleteJob.body.error.message, /tasks are still open/i);

  const incompleteProject = await request(`${base}/projects/${projectId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
  assert.equal(incompleteProject.status, 400);
  assert.match(incompleteProject.body.error.message, /jobs are still open/i);
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
