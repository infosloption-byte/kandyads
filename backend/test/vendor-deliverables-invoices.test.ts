import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let vendorId=0;
let secondVendorId=0;

async function request(path:string,options:RequestInit={}){
  const headers=new Headers(options.headers);
  headers.set('content-type','application/json');
  if(token)headers.set('authorization',`Bearer ${token}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};
  assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);
  return{status:response.statusCode,body};
}

before(async()=>{
  if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp();
  await app.ready();
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});
  assert.equal(login.statusCode,200);
  token=JSON.parse(login.body).data.token;
  const vendor=await prisma.vendor.create({data:{code:`WVD-${Date.now()}`,companyName:`Vendor Deliverable ${Date.now()}`,active:true}});
  vendorId=vendor.id;
  const second=await prisma.vendor.create({data:{code:`WVI-${Date.now()}`,companyName:`Vendor Invoice ${Date.now()}`,active:true}});
  secondVendorId=second.id;
});

after(async()=>{
  for(const id of [vendorId,secondVendorId]){
    if(id){
      await prisma.$executeRaw`DELETE FROM VendorInvoice WHERE vendorId=${id}`.catch(()=>undefined);
      await prisma.$executeRaw`DELETE FROM VendorDeliverable WHERE vendorId=${id}`.catch(()=>undefined);
      await prisma.vendor.delete({where:{id}}).catch(()=>undefined);
    }
  }
  await prisma.$disconnect();
  await app.close();
});

test('vendor deliverables and invoices require authentication',async()=>{
  const deliverable=await app.inject({method:'POST',url:`${base}/vendors/${vendorId}/deliverables`,headers:{'content-type':'application/json'},payload:JSON.stringify({type:'DELIVERY',description:'Test delivery'})});
  assert.equal(deliverable.statusCode,401);
  const invoice=await app.inject({method:'POST',url:`${base}/vendors/${vendorId}/invoices`,headers:{'content-type':'application/json'},payload:JSON.stringify({invoiceNumber:'SUP-AUTH',invoiceDate:'2026-09-02',amount:100})});
  assert.equal(invoice.statusCode,401);
});

test('vendor deliverable and invoice validation rejects missing vendors and invalid payloads',async()=>{
  const missingVendor=await request(`${base}/vendors/999999999/deliverables`,{method:'POST',body:JSON.stringify({type:'DELIVERY',description:'Test delivery'})});
  assert.equal(missingVendor.status,404);
  const invalidDeliverable=await request(`${base}/vendors/${vendorId}/deliverables`,{method:'POST',body:JSON.stringify({type:'',description:''})});
  assert.equal(invalidDeliverable.status,400);
  const invalidInvoice=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'',invoiceDate:'not-a-date',amount:-1})});
  assert.equal(invalidInvoice.status,400);
});

test('vendor deliverable validates linked outsource order ownership',async()=>{
  const job=await prisma.job.findFirst({orderBy:{id:'asc'}});
  assert.ok(job);
  const order=await prisma.outsourceOrder.create({data:{number:`WF-OUT-${Date.now()}`,jobId:job.id,vendorId:secondVendorId,scope:'Workflow test',agreedCost:1000,status:'REQUESTED'}});
  const wrongVendor=await request(`${base}/vendors/${vendorId}/deliverables`,{method:'POST',body:JSON.stringify({type:'DELIVERY',description:'Test delivery',outsourceOrderId:order.id})});
  assert.equal(wrongVendor.status,400);
  assert.match(wrongVendor.body.error.message,/Outsource order not found/);
  await prisma.outsourceOrder.delete({where:{id:order.id}}).catch(()=>undefined);
});

test('vendor deliverable and supplier invoice are persisted with audit side effects',async()=>{
  const deliverable=await request(`${base}/vendors/${vendorId}/deliverables`,{method:'POST',body:JSON.stringify({type:'COMPLETION',reference:'DEL-001',description:'Completed fabricated signboard',deliveredAt:'2026-09-02T10:00:00.000Z',accepted:true,notes:'Accepted by production'})});
  assert.equal(deliverable.status,201);
  assert.equal(deliverable.body.data.vendorId,vendorId);
  assert.equal(deliverable.body.data.accepted,true);

  const invoice=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'SUP-001',invoiceDate:'2026-09-02',dueDate:'2026-09-30',amount:125000.5,status:'RECEIVED',notes:'Supplier invoice'})});
  assert.equal(invoice.status,201);
  assert.equal(invoice.body.data.vendorId,vendorId);
  assert.equal(invoice.body.data.amount,125000.5);

  const duplicate=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'SUP-001',invoiceDate:'2026-09-02',amount:100,status:'RECEIVED'})});
  assert.equal(duplicate.status,409);

  const detail=await request(`${base}/vendors/${vendorId}`);
  assert.equal(detail.status,200);
  assert.equal(detail.body.data.deliverables.length,1);
  assert.equal(detail.body.data.deliverables[0].reference,'DEL-001');
  assert.equal(detail.body.data.invoices.length,1);
  assert.equal(detail.body.data.invoices[0].invoiceNumber,'SUP-001');
  assert.equal(detail.body.data.invoices[0].amount,125000.5);

  const audit=await prisma.auditLog.findMany({where:{entity:'Vendor',entityId:String(vendorId),action:{in:['VENDOR_DELIVERABLE_ADDED','VENDOR_INVOICE_ADDED']}},orderBy:{createdAt:'desc'}});
  assert.equal(audit.length,2);
  assert.ok(audit.some(row=>row.action==='VENDOR_DELIVERABLE_ADDED'));
  assert.ok(audit.some(row=>row.action==='VENDOR_INVOICE_ADDED'));
});
