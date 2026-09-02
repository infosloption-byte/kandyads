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
  app = buildApp(); await app.ready();
  const login = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(login.statusCode, 200); token = JSON.parse(login.body).data.token;
});

after(async () => { await app.close(); await prisma.$disconnect(); });

test('profitability forecast requires authentication', async () => {
  const response = await app.inject({ method: 'GET', url: `${base}/profitability/forecast` });
  assert.equal(response.statusCode, 401);
});

test('profitability forecast returns estimate, actual, remaining estimate and projected final margin', async () => {
  const jobs = await request(`${base}/jobs?pageSize=100`);
  assert.equal(jobs.status, 200);
  const job = jobs.body.data.find((item: any) => !['COMPLETED', 'CANCELLED'].includes(item.status) && Number(item.revenue) > 0);
  assert.ok(job);

  const report = await request(`${base}/profitability/forecast?jobId=${job.id}`);
  assert.equal(report.status, 200);
  assert.equal(report.body.data.rows.length, 1);
  const row = report.body.data.rows[0];
  assert.equal(row.job.id, job.id);
  assert.equal(Number(row.forecastCost), Number(row.actualCost) + Number(row.remainingEstimate));
  assert.equal(Number(row.forecastProfit), Number(row.revenue) - Number(row.forecastCost));
  assert.ok('forecastMarginPercent' in row);
  assert.ok('forecastVariancePercent' in row);
});

test('profitability forecast validates job and project filters', async () => {
  const badJob = await request(`${base}/profitability/forecast?jobId=0`);
  assert.equal(badJob.status, 400);
  const missingJob = await request(`${base}/profitability/forecast?jobId=999999999`);
  assert.equal(missingJob.status, 200);
  assert.deepEqual(missingJob.body.data.rows, []);
});
