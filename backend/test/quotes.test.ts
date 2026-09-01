import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token='';
let quoteId=0;

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
  app=buildApp();
  await app.ready();
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});
  assert.equal(login.statusCode,200);
  token=JSON.parse(login.body).data.token;
});

after(async()=>{
  if(quoteId){
    await prisma.auditLog.deleteMany({where:{entity:'Quote',entityId:String(quoteId)}}).catch(()=>undefined);
    await prisma.quote.delete({where:{id:quoteId}}).catch(()=>undefined);
  }
  await app.close();
  await prisma.$disconnect();
});

test('quote detail, edit, PDF and client decision audit workflow',async()=>{
  const client=await prisma.client.findFirst({orderBy:{id:'asc'}});
  const service=await prisma.service.findFirst({orderBy:{id:'asc'}});
  assert.ok(client); assert.ok(service);
  const created=await prisma.quote.create({data:{number:`TEST-QUOTE-${Date.now()}`,clientId:client.id,status:'DRAFT',subtotal:200,discount:10,tax:19,total:209,expectedMaterial:40,expectedLabour:50,expectedOutsource:20,expectedExpense:10,expectedMargin:89,items:{create:[{serviceId:service.id,description:'Initial creative production',quantity:1,unit:'job',rate:200,discount:10,tax:19,total:209}]}}});
  quoteId=created.id;

  const detail=await request(`${base}/quotes/${quoteId}`);
  assert.equal(detail.status,200);
  assert.equal(detail.body.data.id,quoteId);
  assert.equal(detail.body.data.items.length,1);

  const edited=await request(`${base}/quotes/${quoteId}`,{method:'PATCH',body:JSON.stringify({number:created.number,clientId:client.id,validUntil:new Date(Date.now()+86400000).toISOString(),expectedMaterial:60,expectedLabour:70,expectedOutsource:20,expectedExpense:10,items:[{serviceId:service.id,description:'Updated creative production',quantity:2,unit:'job',rate:150,discount:10,tax:26}]})});
  assert.equal(edited.status,200);
  assert.equal(edited.body.data.items[0].description,'Updated creative production');
  assert.equal(Number(edited.body.data.total),316);
  assert.equal(Number(edited.body.data.expectedMargin),156);

  const pdf=await app.inject({method:'GET',url:`${base}/quotes/${quoteId}/pdf`,headers:{authorization:`Bearer ${token}`}});
  assert.equal(pdf.statusCode,200);
  assert.match(pdf.headers['content-type']||'',/application\/pdf/);
  assert.equal(pdf.rawPayload.subarray(0,5).toString(),'%PDF-');

  const sent=await request(`${base}/quotes/${quoteId}/status`,{method:'PATCH',body:JSON.stringify({status:'SENT'})});
  assert.equal(sent.status,200);
  const rejected=await request(`${base}/quotes/${quoteId}/status`,{method:'PATCH',body:JSON.stringify({status:'REJECTED',reason:'Client postponed the campaign budget.'})});
  assert.equal(rejected.status,200);
  assert.equal(rejected.body.data.status,'REJECTED');

  const history=await request(`${base}/approvals/audit?entity=Quote&entityId=${quoteId}`);
  assert.equal(history.status,200);
  const actions=history.body.data.map((entry:any)=>entry.action);
  assert.ok(actions.includes('UPDATE'));
  assert.ok(actions.includes('STATUS_CHANGE'));
  assert.ok(actions.includes('CLIENT_REJECTED'));
  const decision=history.body.data.find((entry:any)=>entry.action==='CLIENT_REJECTED');
  assert.equal(decision.afterJson.reason,'Client postponed the campaign budget.');

  const blocked=await request(`${base}/quotes/${quoteId}`,{method:'PATCH',body:JSON.stringify({number:created.number,clientId:client.id,items:[{serviceId:service.id,description:'Should fail',quantity:1,unit:'job',rate:1,discount:0,tax:0}]})});
  assert.equal(blocked.status,400);
});
