import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';let app:Awaited<ReturnType<typeof buildApp>>;let token='';let invoiceId=0;let clientId=0;
async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return response;}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const client=await prisma.client.findFirst({orderBy:{id:'asc'},select:{id:true}});assert.ok(client);clientId=client.id;const stamp=Date.now();const invoice=await prisma.invoice.create({data:{number:`TEST-PDF-${stamp}`,clientId,invoiceDate:new Date(),dueDate:new Date(Date.now()+86400000),subtotal:1000,discount:50,tax:171,total:1121,amountPaid:0,balance:1121,status:'ISSUED',items:{create:[{description:'Installation service',quantity:1,unit:'Job',rate:1000,total:1000}]}}});invoiceId=invoice.id;});

after(async()=>{if(invoiceId)await prisma.invoice.delete({where:{id:invoiceId}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('invoice PDF endpoint returns a valid PDF response',async()=>{const response=await request(`${base}/invoices/${invoiceId}/pdf`);assert.equal(response.statusCode,200);assert.equal(response.headers['content-type'],'application/pdf');assert.match(response.headers['content-disposition']??'',/TEST-PDF/);assert.equal(response.rawPayload.subarray(0,8).toString('ascii'),'%PDF-1.4');});

test('invoice PDF rejects missing invoice and unauthenticated access',async()=>{const missing=await request(`${base}/invoices/999999999/pdf`);assert.equal(missing.statusCode,404);const saved=token;token='';const denied=await request(`${base}/invoices/${invoiceId}/pdf`);assert.equal(denied.statusCode,401);token=saved;});
