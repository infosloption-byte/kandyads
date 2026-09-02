import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { workflowRows } from '../src/modules/workflow/workflow.config.js';

const base='/api/v1';
let app: Awaited<ReturnType<typeof buildApp>>;
let token='';
let quoteId=0;
let originalQuoteTransitions:Array<{fromStatus:string;toStatus:string;active:boolean}> = [];

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
  const current=await request(`${base}/settings/workflows/QUOTE`);
  assert.equal(current.status,200);
  originalQuoteTransitions=current.body.data.transitions.map((row:any)=>({fromStatus:row.fromStatus,toStatus:row.toStatus,active:Boolean(row.active)}));
});

after(async()=>{
  if(quoteId){
    await prisma.quoteItem.deleteMany({where:{quoteId}}).catch(()=>undefined);
    await prisma.quote.delete({where:{id:quoteId}}).catch(()=>undefined);
  }
  if(originalQuoteTransitions.length){
    await request(`${base}/settings/workflows/QUOTE`,{method:'PUT',body:JSON.stringify({transitions:originalQuoteTransitions})}).catch(()=>undefined);
  }
  await prisma.$disconnect();
  await app.close();
});

test('workflow configuration requires authentication and exposes all configured entities',async()=>{
  const unauth=await app.inject({method:'GET',url:`${base}/settings/workflows`});
  assert.equal(unauth.statusCode,401);
  const result=await request(`${base}/settings/workflows`);
  assert.equal(result.status,200);
  assert.deepEqual(result.body.data.map((item:any)=>item.entity),['QUOTE','ENQUIRY','PROJECT','JOB','TASK']);
  assert.ok(result.body.data.every((item:any)=>item.statuses.length>0));
});

test('workflow configuration validates transitions and updates the runtime rule map',async()=>{
  const invalid=await request(`${base}/settings/workflows/QUOTE`,{method:'PUT',body:JSON.stringify({transitions:[{fromStatus:'NOPE',toStatus:'SENT',active:true}]})});
  assert.equal(invalid.status,400);

  const duplicate=await request(`${base}/settings/workflows/QUOTE`,{method:'PUT',body:JSON.stringify({transitions:[{fromStatus:'DRAFT',toStatus:'SENT',active:true},{fromStatus:'DRAFT',toStatus:'SENT',active:true}]})});
  assert.equal(duplicate.status,409);

  const current=await request(`${base}/settings/workflows/QUOTE`);
  assert.equal(current.status,200);
  const disabled=current.body.data.transitions.filter((row:any)=>!(row.fromStatus==='DRAFT'&&row.toStatus==='SENT')).map((row:any)=>({fromStatus:row.fromStatus,toStatus:row.toStatus,active:Boolean(row.active)}));
  const saved=await request(`${base}/settings/workflows/QUOTE`,{method:'PUT',body:JSON.stringify({transitions:disabled})});
  assert.equal(saved.status,200);
  assert.equal(saved.body.data.transitions.some((row:any)=>row.fromStatus==='DRAFT'&&row.toStatus==='SENT'),false);
  assert.equal((workflowRows('QUOTE') as any[]).some((row)=>row.fromStatus==='DRAFT'&&row.toStatus==='SENT'),false);
});

test('disabled workflow transition is enforced by existing quote status endpoint',async()=>{
  const client=await prisma.client.findFirst({orderBy:{id:'asc'}});
  assert.ok(client);
  const quote=await prisma.quote.create({data:{number:`WF-${Date.now()}`,clientId:client.id,subtotal:100,discount:0,tax:0,total:100,expectedMaterial:0,expectedLabour:0,expectedOutsource:0,expectedExpense:0,expectedMargin:100,items:{create:[{description:'Workflow test',quantity:1,unit:'nos',rate:100,total:100}]}}});
  quoteId=quote.id;
  const blocked=await request(`${base}/quotes/${quote.id}/status`,{method:'PATCH',body:JSON.stringify({status:'SENT'})});
  assert.equal(blocked.status,400);
  assert.match(blocked.body.error.message,/Invalid quote transition/);
});
