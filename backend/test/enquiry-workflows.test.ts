import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let enquiryId=0;
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
  const client=await prisma.client.findFirst({orderBy:{id:'asc'}}); assert.ok(client); clientId=client.id;
  const enquiry=await prisma.enquiry.create({data:{number:`TEST-WF-ENQ-${Date.now()}-${Math.floor(Math.random()*10000)}`,clientId,requirement:'Dedicated enquiry workflow test',status:'OPEN',source:'Automated Test',siteLocation:'Test Site',priority:'MEDIUM'}});
  enquiryId=enquiry.id;
});

after(async()=>{if(enquiryId){await prisma.auditLog.deleteMany({where:{entity:'Enquiry',entityId:String(enquiryId)}}).catch(()=>undefined);await prisma.quote.deleteMany({where:{enquiryId}}).catch(()=>undefined);await prisma.enquiry.delete({where:{id:enquiryId}}).catch(()=>undefined);}await app.close();await prisma.$disconnect();});

test('enquiry detail requires authentication',async()=>{
  const saved=token; token='';
  const response=await request(`${base}/enquiries/${enquiryId}`);
  token=saved;
  assert.equal(response.status,401);
});

test('enquiry detail returns client and linked quote data',async()=>{
  const response=await request(`${base}/enquiries/${enquiryId}`); assert.equal(response.status,200); assert.equal(response.body.data.id,enquiryId); assert.ok(response.body.data.client); assert.ok(Array.isArray(response.body.data.quote));
});

test('enquiry edit updates fields and records audit activity',async()=>{
  const value=`Automated enquiry requirement ${Date.now()}`;
  const response=await request(`${base}/enquiries/${enquiryId}`,{method:'PATCH',body:JSON.stringify({requirement:value,priority:'HIGH'})});
  assert.equal(response.status,200); assert.equal(response.body.data.requirement,value); assert.equal(response.body.data.priority,'HIGH');
  const history=await request(`${base}/enquiries/${enquiryId}/activity`); assert.equal(history.status,200); assert.ok(history.body.data.some((row:any)=>row.action==='UPDATE'));
});

test('enquiry edit validates missing related client and invalid input',async()=>{
  const missing=await request(`${base}/enquiries/999999999`,{method:'PATCH',body:JSON.stringify({requirement:'Missing'})}); assert.equal(missing.status,404);
  const invalid=await request(`${base}/enquiries/${enquiryId}`,{method:'PATCH',body:JSON.stringify({clientId:0})}); assert.equal(invalid.status,400);
});

test('enquiry status transition enforces workflow rules',async()=>{
  const invalid=await request(`${base}/enquiries/${enquiryId}/status`,{method:'PATCH',body:JSON.stringify({status:'CONVERTED'})}); assert.equal(invalid.status,400);
  const valid=await request(`${base}/enquiries/${enquiryId}/status`,{method:'PATCH',body:JSON.stringify({status:'QUOTING'})}); assert.equal(valid.status,200); assert.equal(valid.body.data.status,'QUOTING');
  const history=await request(`${base}/enquiries/${enquiryId}/activity`); assert.ok(history.body.data.some((row:any)=>row.action==='STATUS_CHANGE'));
});
