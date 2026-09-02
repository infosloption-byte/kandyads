import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let clientId=0;
let createdAttachmentId=0;

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

after(async()=>{if(createdAttachmentId)await prisma.attachment.delete({where:{id:createdAttachmentId}}).catch(()=>undefined);await prisma.auditLog.deleteMany({where:{entity:'CLIENT',entityId:String(clientId),action:'ATTACHMENT_ADDED'}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('attachment endpoints require authentication',async()=>{
  const response=await app.inject({method:'GET',url:`${base}/attachments?entityType=CLIENT&entityId=${clientId}`});
  assert.equal(response.statusCode,401);
});

test('client document can be registered and listed',async()=>{
  const created=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'CLIENT',entityId:clientId,name:`Automated document ${Date.now()}`,description:'Client document test',mimeType:'application/pdf',url:'https://example.com/client-document.pdf'})});
  assert.equal(created.status,201); createdAttachmentId=created.body.data.id; assert.equal(created.body.data.entityType,'CLIENT'); assert.equal(created.body.data.entityId,clientId);
  const list=await request(`${base}/attachments?entityType=CLIENT&entityId=${clientId}`); assert.equal(list.status,200); assert.ok(list.body.data.some((item:any)=>item.id===createdAttachmentId));
});

test('attachment validates required storage reference',async()=>{
  const response=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'CLIENT',entityId:clientId,name:'No storage reference'})});
  assert.equal(response.status,400);
});

test('attachment rejects missing related record',async()=>{
  const response=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'CLIENT',entityId:999999999,name:'Missing client',url:'https://example.com/missing.pdf'})});
  assert.equal(response.status,400);
});

test('attachment rejects unsupported entity type',async()=>{
  const response=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'UNKNOWN',entityId:clientId,name:'Bad type',url:'https://example.com/bad.pdf'})});
  assert.equal(response.status,400);
});

test('attachment creation writes audit history',async()=>{
  const audit=await prisma.auditLog.findMany({where:{entity:'CLIENT',entityId:String(clientId),action:'ATTACHMENT_ADDED'},orderBy:{createdAt:'desc'}});
  assert.ok(audit.some(item=>JSON.stringify(item.afterJson).includes(String(createdAttachmentId))));
});
