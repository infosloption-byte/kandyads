import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let vendorId=0;
let attachmentId=0;

async function request(path:string, options:RequestInit={}){
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
  app=buildApp();
  await app.ready();
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});
  assert.equal(login.statusCode,200);
  token=JSON.parse(login.body).data.token;
});

after(async()=>{
  if(attachmentId) await prisma.attachment.delete({where:{id:attachmentId}}).catch(()=>undefined);
  if(vendorId) await prisma.vendor.delete({where:{id:vendorId}}).catch(()=>undefined);
  await prisma.$disconnect();
  await app.close();
});

test('vendor detail requires authentication and returns not-found correctly',async()=>{
  const unauth=await app.inject({method:'GET',url:`${base}/vendors/999999999`});
  assert.equal(unauth.statusCode,401);
  const missing=await request(`${base}/vendors/999999999`);
  assert.equal(missing.status,404);
});

test('vendor documents can be registered through generic attachment workflow',async()=>{
  const vendor=await prisma.vendor.create({data:{code:`WFD-${Date.now()}`,companyName:`Workflow Vendor ${Date.now()}`,active:true}});
  vendorId=vendor.id;
  const created=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'VENDOR',entityId:vendor.id,name:'Supplier Certificate',description:'Vendor registration certificate',url:'https://example.com/vendor-certificate.pdf'})});
  assert.equal(created.status,201);
  attachmentId=created.body.data.id;
  const detail=await request(`${base}/vendors/${vendor.id}`);
  assert.equal(detail.status,200);
  assert.equal(detail.body.data.attachments.length,1);
  assert.equal(detail.body.data.attachments[0].id,attachmentId);
  const listed=await request(`${base}/attachments?entityType=VENDOR&entityId=${vendor.id}`);
  assert.equal(listed.status,200);
  assert.equal(listed.body.data.length,1);
});

test('vendor attachment validation rejects missing related vendor',async()=>{
  const missing=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'VENDOR',entityId:999999999,name:'Missing Vendor Doc',url:'https://example.com/missing.pdf'})});
  assert.equal(missing.status,400);
});
