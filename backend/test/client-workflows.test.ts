import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let clientId=0;

async function request(path:string,options:RequestInit={}){
  const headers=new Headers(options.headers);
  headers.set('content-type','application/json');
  if(token) headers.set('authorization',`Bearer ${token}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};
  assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);
  return {status:response.statusCode,body};
}

before(async()=>{
  if(process.env.NODE_ENV==='production') throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp(); await app.ready();
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});
  assert.equal(login.statusCode,200); token=JSON.parse(login.body).data.token;
  const client=await prisma.client.findFirst({orderBy:{id:'desc'}}); assert.ok(client); clientId=client.id;
});

after(async()=>{if(clientId)await prisma.auditLog.deleteMany({where:{entity:'Client',entityId:String(clientId)}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('client edit updates fields and writes audit history',async()=>{
  const before=await request(`${base}/clients/${clientId}`); assert.equal(before.status,200);
  const updated=await request(`${base}/clients/${clientId}`,{method:'PATCH',body:JSON.stringify({contactName:`Automated Client Contact ${Date.now()}`,paymentTerms:'30 days',active:false})});
  assert.equal(updated.status,200); assert.equal(updated.body.data.id,clientId); assert.equal(updated.body.data.active,false); assert.equal(updated.body.data.paymentTerms,'30 days');
  const after=await request(`${base}/clients/${clientId}`); assert.equal(after.status,200); assert.equal(after.body.data.active,false);
  const audit=await prisma.auditLog.findMany({where:{entity:'Client',entityId:String(clientId),action:'UPDATE'}}); assert.ok(audit.length>=1);
});

test('client list supports active filter and pagination metadata',async()=>{
  const inactive=await request(`${base}/clients?active=false&page=1&pageSize=5`); assert.equal(inactive.status,200); assert.equal(inactive.body.meta.page,1); assert.equal(inactive.body.meta.pageSize,5); assert.ok(inactive.body.data.some((row:any)=>row.id===clientId)); assert.ok(inactive.body.data.every((row:any)=>row.active===false));
  const active=await request(`${base}/clients?active=true&pageSize=5`); assert.equal(active.status,200); assert.ok(active.body.data.every((row:any)=>row.active===true));
});

test('client edit validates missing and invalid records',async()=>{
  const missing=await request(`${base}/clients/999999999`,{method:'PATCH',body:JSON.stringify({companyName:'Missing'})}); assert.equal(missing.status,404);
  const invalid=await request(`${base}/clients/${clientId}`,{method:'PATCH',body:JSON.stringify({email:'not-an-email'})}); assert.equal(invalid.status,400);
});

test('client create rejects duplicate client codes',async()=>{
  const existing=await prisma.client.findUnique({where:{id:clientId}}); assert.ok(existing);
  const duplicate=await request(`${base}/clients`,{method:'POST',body:JSON.stringify({code:existing.code,companyName:'Duplicate Client'})});
  assert.equal(duplicate.status,409);
});
