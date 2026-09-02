import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let vendorId=0;
let otherVendorId=0;
let purchaseOrderId=0;
let goodsReceiptId=0;
let materialId=0;
let warehouseId=0;

async function request(path:string,options:RequestInit={}){
  const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return{status:response.statusCode,body};
}

before(async()=>{
  if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp();await app.ready();
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;
  const vendor=await prisma.vendor.create({data:{code:`PIL-${Date.now()}`,companyName:`Purchasing Invoice ${Date.now()}`,active:true}});vendorId=vendor.id;
  const other=await prisma.vendor.create({data:{code:`PIL-X-${Date.now()}`,companyName:`Other Invoice Vendor ${Date.now()}`,active:true}});otherVendorId=other.id;
  const material=await prisma.material.findFirst({orderBy:{id:'asc'}});assert.ok(material);materialId=material.id;
  const warehouse=await prisma.warehouse.findFirst({orderBy:{id:'asc'}});assert.ok(warehouse);warehouseId=warehouse.id;
  const order=await prisma.purchaseOrder.create({data:{number:`PIL-PO-${Date.now()}`,vendorId,orderDate:new Date('2026-09-02T08:00:00.000Z'),subtotal:1000,discount:0,tax:0,total:1000,status:'APPROVED',items:{create:{materialId,description:'Invoice linkage test material',quantity:10,unit:'Nos',unitCost:100,total:1000}}}});purchaseOrderId=order.id;
  const poItem=order && await prisma.purchaseOrderItem.findFirst({where:{purchaseOrderId}});assert.ok(poItem);
  const receipt=await prisma.goodsReceipt.create({data:{number:`PIL-GRN-${Date.now()}`,purchaseOrderId,warehouseId,receivedDate:new Date('2026-09-02T09:00:00.000Z'),status:'POSTED',supplierReference:'SUP-TEST',items:{create:{purchaseOrderItemId:poItem.id,materialId,receivedQty:5,unitCost:100}}}});goodsReceiptId=receipt.id;
});

after(async()=>{
  if(vendorId) await prisma.$executeRaw`DELETE FROM VendorInvoice WHERE vendorId=${vendorId}`.catch(()=>undefined);
  if(otherVendorId) await prisma.$executeRaw`DELETE FROM VendorInvoice WHERE vendorId=${otherVendorId}`.catch(()=>undefined);
  if(goodsReceiptId) await prisma.goodsReceipt.delete({where:{id:goodsReceiptId}}).catch(()=>undefined);
  if(purchaseOrderId) await prisma.purchaseOrder.delete({where:{id:purchaseOrderId}}).catch(()=>undefined);
  await prisma.vendor.deleteMany({where:{id:{in:[vendorId,otherVendorId]}}});
  await prisma.$disconnect();await app.close();
});

test('supplier invoice linkage requires authentication',async()=>{
  const response=await app.inject({method:'POST',url:`${base}/vendors/${vendorId}/invoices`,headers:{'content-type':'application/json'},payload:JSON.stringify({invoiceNumber:'PIL-AUTH',invoiceDate:'2026-09-02',amount:100,purchaseOrderId})});assert.equal(response.statusCode,401);
});

test('supplier invoice rejects missing and cross-vendor purchasing records',async()=>{
  const missing=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-MISSING',invoiceDate:'2026-09-02',amount:100,purchaseOrderId:999999999})});assert.equal(missing.status,400);assert.match(missing.body.error.message,/Purchase order not found/);
  const crossVendor=await request(`${base}/vendors/${otherVendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-CROSS',invoiceDate:'2026-09-02',amount:100,purchaseOrderId})});assert.equal(crossVendor.status,400);assert.match(crossVendor.body.error.message,/does not belong to this vendor/);
  const wrongReceipt=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-WRONG-GR',invoiceDate:'2026-09-02',amount:100,goodsReceiptId:999999999})});assert.equal(wrongReceipt.status,400);assert.match(wrongReceipt.body.error.message,/Goods receipt not found/);
});

test('supplier invoice links to purchase order and goods receipt, and infers PO from receipt',async()=>{
  const created=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-001',invoiceDate:'2026-09-02',dueDate:'2026-09-30',amount:500,status:'RECEIVED',purchaseOrderId,goodsReceiptId,notes:'Linked supplier invoice'})});
  assert.equal(created.status,201);assert.equal(created.body.data.purchaseOrderId,purchaseOrderId);assert.equal(created.body.data.goodsReceiptId,goodsReceiptId);assert.equal(created.body.data.amount,500);
  const inferred=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-002',invoiceDate:'2026-09-02',amount:250,goodsReceiptId})});assert.equal(inferred.status,201);assert.equal(inferred.body.data.purchaseOrderId,purchaseOrderId);assert.equal(inferred.body.data.goodsReceiptId,goodsReceiptId);
  const list=await request(`${base}/vendor-invoices?purchaseOrderId=${purchaseOrderId}`);assert.equal(list.status,200);assert.equal(list.body.data.length,2);assert.ok(list.body.data.every((row:any)=>row.purchaseOrderId===purchaseOrderId));
});

test('supplier invoice rejects mismatched purchase order and receipt',async()=>{
  const otherOrder=await prisma.purchaseOrder.create({data:{number:`PIL-PO-X-${Date.now()}`,vendorId,orderDate:new Date('2026-09-02T08:00:00.000Z'),subtotal:200,discount:0,tax:0,total:200,status:'APPROVED',items:{create:{materialId,description:'Second order',quantity:2,unit:'Nos',unitCost:100,total:200}}}});
  try {
    const mismatch=await request(`${base}/vendors/${vendorId}/invoices`,{method:'POST',body:JSON.stringify({invoiceNumber:'PIL-MISMATCH',invoiceDate:'2026-09-02',amount:100,purchaseOrderId:otherOrder.id,goodsReceiptId})});
    assert.equal(mismatch.status,400);assert.match(mismatch.body.error.message,/Goods receipt does not belong to selected purchase order/);
  } finally { await prisma.purchaseOrder.delete({where:{id:otherOrder.id}}).catch(()=>undefined); }
});

test('supplier invoice creation records purchasing links in audit history',async()=>{
  const rows=await prisma.auditLog.findMany({where:{entity:'Vendor',entityId:String(vendorId),action:'VENDOR_INVOICE_ADDED'},orderBy:{createdAt:'desc'},take:2});assert.equal(rows.length,2);
  assert.ok(rows.some(row=>String(row.afterJson).includes(String(purchaseOrderId))));
  assert.ok(rows.some(row=>String(row.afterJson).includes(String(goodsReceiptId))));
});
