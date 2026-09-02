import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base = '/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token = '';

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
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS CompanySetting (id INT NOT NULL DEFAULT 1, companyName VARCHAR(200) NOT NULL, legalName VARCHAR(200) NULL, phone VARCHAR(50) NULL, email VARCHAR(191) NULL, address TEXT NULL, website VARCHAR(255) NULL, taxNumber VARCHAR(100) NULL, updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await prisma.$executeRawUnsafe(`INSERT INTO CompanySetting (id, companyName) VALUES (1, 'Kandy Ads Private Limited') ON DUPLICATE KEY UPDATE id = id`);
  const login = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(login.statusCode, 200);
  token = JSON.parse(login.body).data.token;
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test('company settings requires authentication', async () => {
  const response = await app.inject({ method: 'GET', url: `${base}/settings/company` });
  assert.equal(response.statusCode, 401);
});

test('company settings returns the singleton profile', async () => {
  const response = await request(`${base}/settings/company`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 1);
  assert.equal(response.body.data.companyName, 'Kandy Ads Private Limited');
});

test('company settings validates email and website', async () => {
  const response = await request(`${base}/settings/company`, { method: 'PUT', body: JSON.stringify({ companyName: 'Kandy Ads', email: 'not-an-email', website: 'not-a-url' }) });
  assert.equal(response.status, 400);
});

test('company settings updates profile and writes an audit record', async () => {
  const before = await prisma.auditLog.count({ where: { entity: 'CompanySetting', entityId: '1', action: 'COMPANY_SETTINGS_UPDATED' } });
  const response = await request(`${base}/settings/company`, {
    method: 'PUT',
    body: JSON.stringify({ companyName: 'Kandy Ads Private Limited', legalName: 'Kandy Ads Private Limited', phone: '+94 81 000 0000', email: 'ops@kandyads.lk', address: 'Kandy, Sri Lanka', website: 'https://kandyads.lk', taxNumber: 'TEST-TAX-001' }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.companyName, 'Kandy Ads Private Limited');
  assert.equal(response.body.data.taxNumber, 'TEST-TAX-001');
  const after = await prisma.auditLog.count({ where: { entity: 'CompanySetting', entityId: '1', action: 'COMPANY_SETTINGS_UPDATED' } });
  assert.equal(after, before + 1);
});
