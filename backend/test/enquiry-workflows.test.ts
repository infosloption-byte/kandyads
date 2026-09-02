import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let enquiryId=0;
let original:any;

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
  const enquiry=await prisma.enquiry.findFirst({where:{status:{in:['OPEN','QUOTING']}},orderBy:{id:'desc'}}); assert.ok(enquiry); enquiryId=enquiry.id;
  original={source:enquiry.source,requirement:enquiry.requirement,siteLocation:enquiry.siteLocation,targetDate:enquiry.targetDate,priority:enquiry.priority,clientId:enquiry.clientId,status:enquiry.status};
});

after(async()=>{if(enquiryId){await prisma.enquiry.update({where:{id:enquiryId},data:original}).catch(()=>undefined);await prisma.auditLog.deleteMany({where:{entity:'Enquiry',entityId:String(enquiryId)}}).catch(()=>undefined);}await app.close();await prisma.$disconnect();});

test('enquiry detail requires authentication',async()=>{
  const saved=token; token='';
  const response=await request(`${base}/enquiries/${enquiryId}`);
  token=saved;
  assert.equal(response.status,401);
});

test('enquiry detail returns client and linked quote data',async()=>{
  const response=await request(`${base}/enquiries/${enquiryId}`); assert.equal(response.status,200); assert.equal(response.body.data.id,enquiryId); assert.ok(response.body.data.client);
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
  const current=original.status;
  const invalidTarget=current==='OPEN'?'CONVERTED':'OPEN';
  const invalid=await request(`${base}/enquiries/${enquiryId}/status`,{method:'PATCH',body:JSON.stringify({status:invalidTarget})}); assert.equal(invalid.status,400);
  const validTarget=current==='OPEN'?'QUOTING':'CLOSED';
  const valid=await request(`${base}/enquiries/${enquiryId}/status`,{method:'PATCH',body:JSON.stringify({status:validTarget})}); assert.equal(valid.status,200); assert.equal(valid.body.data.status,validTarget);
  const history=await request(`${base}/enquiries/${enquiryId}/activity`); assert.ok(history.body.data.some((row:any)=>row.action==='STATUS_CHANGE'));
});
