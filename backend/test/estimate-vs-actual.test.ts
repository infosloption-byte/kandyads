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
  const login = await app.inject({ method: 'POST', url: `${base}/auth/login`, headers: { 'content-type': 'application/json' }, payload: JSON.stringify({ email: 'admin@kandyads.lk', password: 'ChangeMe!123' }) });
  assert.equal(login.statusCode, 200);
  token = JSON.parse(login.body).data.token;
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test('estimate versus actual report requires authentication', async () => {
  const response = await app.inject({ method: 'GET', url: `${base}/profitability/estimate-vs-actual` });
  assert.equal(response.statusCode, 401);
});

test('estimate versus actual report exposes category and total variances', async () => {
  const response = await request(`${base}/profitability/estimate-vs-actual`);
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.data.rows));
  assert.ok(response.body.data.totals);
  for (const category of ['material', 'labour', 'outsource', 'expense', 'total']) {
    const total = response.body.data.totals[category];
    assert.equal(typeof total.estimated, 'number');
    assert.equal(typeof total.actual, 'number');
    assert.equal(typeof total.variance, 'number');
    assert.ok(total.variancePercent === null || typeof total.variancePercent === 'number');
    assert.equal(Number(total.actual - total.estimated).toFixed(2), Number(total.variance).toFixed(2));
  }
  const row = response.body.data.rows[0];
  if (row) {
    assert.ok(row.job?.id);
    assert.equal(Number(row.total.actual - row.total.estimated).toFixed(2), Number(row.total.variance).toFixed(2));
    assert.equal(Number(row.material.actual - row.material.estimated).toFixed(2), Number(row.material.variance).toFixed(2));
  }
});

test('estimate versus actual report supports job and project filters', async () => {
  const jobs = await request(`${base}/jobs?page=1&pageSize=1`);
  assert.equal(jobs.status, 200);
  const jobId = jobs.body.data[0]?.id;
  assert.ok(jobId);
  const jobReport = await request(`${base}/profitability/estimate-vs-actual?jobId=${jobId}`);
  assert.equal(jobReport.status, 200);
  assert.equal(jobReport.body.data.rows.length, 1);
  assert.equal(jobReport.body.data.rows[0].job.id, jobId);

  const projectId = jobs.body.data[0]?.projectId;
  assert.ok(projectId);
  const projectReport = await request(`${base}/profitability/estimate-vs-actual?projectId=${projectId}`);
  assert.equal(projectReport.status, 200);
  assert.ok(projectReport.body.data.rows.every((row: any) => row.job.projectId === projectId));
});
