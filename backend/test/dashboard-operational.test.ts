import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1'; let app:Awaited<ReturnType<typeof buildApp>>; let token='';
async function request(path:string){const response=await app.inject({method:'GET',url:path,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'}});assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return {status:response.statusCode,body:JSON.parse(response.body)}}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token});
after(async()=>{await app.close();await prisma.$disconnect()});

test('operational dashboard requires authentication',async()=>{const response=await app.inject({method:'GET',url:`${base}/dashboard/operational`});assert.equal(response.statusCode,401)});
test('operational dashboard returns live reporting sections',async()=>{const result=await request(`${base}/dashboard/operational?days=14`);assert.equal(result.status,200);const data=result.body.data;assert.equal(data.window.days,14);assert.ok(Array.isArray(data.jobs.due));assert.ok(Array.isArray(data.jobs.upcoming));assert.ok(Array.isArray(data.inventory.reorderAlerts));assert.ok(Array.isArray(data.purchasing.due));assert.ok(Array.isArray(data.installations));assert.ok(Array.isArray(data.workload));for(const key of ['revenue','expenses','profit','receivables','overdueReceivables'])assert.equal(typeof data.finance[key],'number')});
test('operational dashboard validates reporting window',async()=>{const zero=await request(`${base}/dashboard/operational?days=0`);assert.equal(zero.status,400);const huge=await request(`${base}/dashboard/operational?days=91`);assert.equal(huge.status,400)});
