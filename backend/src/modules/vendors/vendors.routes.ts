import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const vendorSchema = z.object({
  code: z.string().min(1).max(50), companyName: z.string().min(1).max(200), contactName: z.string().max(150).optional().nullable(),
  phone: z.string().max(50).optional().nullable(), whatsapp: z.string().max(50).optional().nullable(), email: z.string().email().max(191).optional().nullable(),
  address: z.string().optional().nullable(), category: z.string().max(150).optional().nullable(), capabilities: z.string().optional().nullable(),
  paymentTerms: z.string().max(150).optional().nullable(), bankDetails: z.string().optional().nullable(), active: z.boolean().optional().default(true),
});
const deliverableSchema=z.object({type:z.string().trim().min(1).max(50),reference:z.string().trim().max(100).optional().nullable(),description:z.string().trim().min(1).max(500),deliveredAt:z.coerce.date().optional().nullable(),accepted:z.boolean().optional().default(false),notes:z.string().max(5000).optional().nullable(),outsourceOrderId:z.coerce.number().int().positive().optional().nullable()});
const invoiceSchema=z.object({invoiceNumber:z.string().trim().min(1).max(100),invoiceDate:z.coerce.date(),dueDate:z.coerce.date().optional().nullable(),amount:z.coerce.number().nonnegative(),status:z.enum(['RECEIVED','VERIFIED','PAID','DISPUTED','CANCELLED']).default('RECEIVED'),notes:z.string().max(5000).optional().nullable(),outsourceOrderId:z.coerce.number().int().positive().optional().nullable(),purchaseOrderId:z.coerce.number().int().positive().optional().nullable(),goodsReceiptId:z.coerce.number().int().positive().optional().nullable()});
function actorId(request:FastifyRequest){const id=Number((request.user as {sub?:string}).sub);return Number.isInteger(id)&&id>0?id:null;}

async function resolveInvoiceLinks(vendorId:number,input:z.infer<typeof invoiceSchema>){
  let purchaseOrderId=input.purchaseOrderId??null;
  if(input.goodsReceiptId){
    const receipt=await prisma.goodsReceipt.findUnique({where:{id:input.goodsReceiptId},include:{purchaseOrder:{select:{id:true,vendorId:true}}}});
    if(!receipt) throw new Error('Goods receipt not found');
    if(receipt.purchaseOrder.vendorId!==vendorId) throw new Error('Goods receipt does not belong to this vendor');
    if(purchaseOrderId&&receipt.purchaseOrder.id!==purchaseOrderId) throw new Error('Goods receipt does not belong to selected purchase order');
    purchaseOrderId=receipt.purchaseOrder.id;
  }
  if(purchaseOrderId){
    const order=await prisma.purchaseOrder.findUnique({where:{id:purchaseOrderId},select:{id:true,vendorId:true}});
    if(!order) throw new Error('Purchase order not found');
    if(order.vendorId!==vendorId) throw new Error('Purchase order does not belong to this vendor');
  }
  return {purchaseOrderId,goodsReceiptId:input.goodsReceiptId??null};
}

export async function vendorsRoutes(app: FastifyInstance) {
  app.get('/api/v1/vendors', async (request) => {
    const query = z.object({ q: z.string().optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const data = await prisma.vendor.findMany({where:{active: query.active ? query.active === 'true' : undefined,...(query.q ? { OR: [{ code: { contains: query.q } }, { companyName: { contains: query.q } }, { category: { contains: query.q } }] } : {})},include:{_count:{select:{assignments:true,outsourceOrders:true}}},orderBy:{companyName:'asc'}});
    return { data };
  });

  app.get('/api/v1/vendors/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const vendor = await prisma.vendor.findUnique({where:{id},include:{_count:{select:{assignments:true,outsourceOrders:true}},assignments:{include:{job:true},orderBy:{id:'desc'},take:50},outsourceOrders:{include:{job:true},orderBy:{id:'desc'},take:50}}});
    if (!vendor) return reply.notFound('Vendor not found');
    const [attachments,deliverables,invoices]=await Promise.all([
      prisma.attachment.findMany({where:{entityType:'VENDOR',entityId:id},include:{uploadedBy:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:'desc'}}),
      prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT id,vendorId,outsourceOrderId,type,reference,description,deliveredAt,accepted,notes,createdAt,updatedAt FROM VendorDeliverable WHERE vendorId=${id} ORDER BY createdAt DESC`),
      prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT vi.id,vi.vendorId,vi.outsourceOrderId,vi.purchaseOrderId,vi.goodsReceiptId,vi.invoiceNumber,vi.invoiceDate,vi.dueDate,vi.amount,vi.status,vi.notes,vi.createdAt,vi.updatedAt,po.number AS purchaseOrderNumber,gr.number AS goodsReceiptNumber FROM VendorInvoice vi LEFT JOIN PurchaseOrder po ON po.id=vi.purchaseOrderId LEFT JOIN GoodsReceipt gr ON gr.id=vi.goodsReceiptId WHERE vi.vendorId=${id} ORDER BY vi.invoiceDate DESC, vi.id DESC`),
    ]);
    return {data:{...vendor,attachments,deliverables:deliverables.map(row=>({...row,id:Number(row.id),vendorId:Number(row.vendorId),outsourceOrderId:row.outsourceOrderId==null?null:Number(row.outsourceOrderId),accepted:Boolean(row.accepted)})),invoices:invoices.map(row=>({...row,id:Number(row.id),vendorId:Number(row.vendorId),outsourceOrderId:row.outsourceOrderId==null?null:Number(row.outsourceOrderId),purchaseOrderId:row.purchaseOrderId==null?null:Number(row.purchaseOrderId),goodsReceiptId:row.goodsReceiptId==null?null:Number(row.goodsReceiptId),amount:Number(row.amount)}))}};
  });

  app.get('/api/v1/vendor-invoices', async (request) => {
    const query=z.object({vendorId:z.coerce.number().int().positive().optional(),purchaseOrderId:z.coerce.number().int().positive().optional(),goodsReceiptId:z.coerce.number().int().positive().optional(),status:z.string().optional()}).parse(request.query);
    const data=await prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT vi.id,vi.vendorId,vi.outsourceOrderId,vi.purchaseOrderId,vi.goodsReceiptId,vi.invoiceNumber,vi.invoiceDate,vi.dueDate,vi.amount,vi.status,vi.notes,vi.createdAt,vi.updatedAt,v.companyName,po.number AS purchaseOrderNumber,gr.number AS goodsReceiptNumber FROM VendorInvoice vi INNER JOIN Vendor v ON v.id=vi.vendorId LEFT JOIN PurchaseOrder po ON po.id=vi.purchaseOrderId LEFT JOIN GoodsReceipt gr ON gr.id=vi.goodsReceiptId WHERE (${query.vendorId??null} IS NULL OR vi.vendorId=${query.vendorId??null}) AND (${query.purchaseOrderId??null} IS NULL OR vi.purchaseOrderId=${query.purchaseOrderId??null}) AND (${query.goodsReceiptId??null} IS NULL OR vi.goodsReceiptId=${query.goodsReceiptId??null}) AND (${query.status??null} IS NULL OR vi.status=${query.status??null}) ORDER BY vi.invoiceDate DESC,vi.id DESC`);
    return {data:data.map(row=>({...row,id:Number(row.id),vendorId:Number(row.vendorId),outsourceOrderId:row.outsourceOrderId==null?null:Number(row.outsourceOrderId),purchaseOrderId:row.purchaseOrderId==null?null:Number(row.purchaseOrderId),goodsReceiptId:row.goodsReceiptId==null?null:Number(row.goodsReceiptId),amount:Number(row.amount)}))};
  });

  app.post('/api/v1/vendors', async (request, reply) => {const input=vendorSchema.parse(request.body);const data=await prisma.vendor.create({data:input});return reply.code(201).send({data});});

  app.post('/api/v1/vendors/:id/deliverables',async(request,reply)=>{
    const vendorId=z.coerce.number().int().positive().parse((request.params as any).id);const input=deliverableSchema.parse(request.body);const vendor=await prisma.vendor.findUnique({where:{id:vendorId},select:{id:true}});if(!vendor)return reply.notFound('Vendor not found');
    if(input.outsourceOrderId){const order=await prisma.outsourceOrder.findFirst({where:{id:input.outsourceOrderId,vendorId},select:{id:true}});if(!order)return reply.badRequest('Outsource order not found for this vendor');}
    const data=await prisma.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`INSERT INTO VendorDeliverable (vendorId,outsourceOrderId,type,reference,description,deliveredAt,accepted,notes) VALUES (${vendorId},${input.outsourceOrderId??null},${input.type},${input.reference??null},${input.description},${input.deliveredAt??null},${input.accepted},${input.notes??null})`);const inserted=await tx.$queryRaw<Array<any>>(Prisma.sql`SELECT * FROM VendorDeliverable WHERE vendorId=${vendorId} ORDER BY id DESC LIMIT 1`);const item=inserted[0];await tx.auditLog.create({data:{userId:actorId(request),action:'VENDOR_DELIVERABLE_ADDED',entity:'Vendor',entityId:String(vendorId),afterJson:{deliverableId:Number(item.id),outsourceOrderId:item.outsourceOrderId==null?null:Number(item.outsourceOrderId),type:item.type,accepted:Boolean(item.accepted)}}});return item;});
    return reply.code(201).send({data:{...data,id:Number(data.id),vendorId:Number(data.vendorId),outsourceOrderId:data.outsourceOrderId==null?null:Number(data.outsourceOrderId),accepted:Boolean(data.accepted)}});
  });

  app.post('/api/v1/vendors/:id/invoices',async(request,reply)=>{
    const vendorId=z.coerce.number().int().positive().parse((request.params as any).id);const input=invoiceSchema.parse(request.body);const vendor=await prisma.vendor.findUnique({where:{id:vendorId},select:{id:true}});if(!vendor)return reply.notFound('Vendor not found');
    if(input.outsourceOrderId){const order=await prisma.outsourceOrder.findFirst({where:{id:input.outsourceOrderId,vendorId},select:{id:true}});if(!order)return reply.badRequest('Outsource order not found for this vendor');}
    let links:{purchaseOrderId:number|null;goodsReceiptId:number|null};try{links=await resolveInvoiceLinks(vendorId,input);}catch(error){return reply.badRequest(error instanceof Error?error.message:'Invalid purchasing link');}
    const duplicate=await prisma.$queryRaw<Array<{id:number}>>(Prisma.sql`SELECT id FROM VendorInvoice WHERE vendorId=${vendorId} AND invoiceNumber=${input.invoiceNumber} LIMIT 1`);if(duplicate.length)return reply.conflict('Supplier invoice number already exists for this vendor');
    const data=await prisma.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`INSERT INTO VendorInvoice (vendorId,outsourceOrderId,purchaseOrderId,goodsReceiptId,invoiceNumber,invoiceDate,dueDate,amount,status,notes) VALUES (${vendorId},${input.outsourceOrderId??null},${links.purchaseOrderId},${links.goodsReceiptId},${input.invoiceNumber},${input.invoiceDate},${input.dueDate??null},${input.amount},${input.status},${input.notes??null})`);const inserted=await tx.$queryRaw<Array<any>>(Prisma.sql`SELECT * FROM VendorInvoice WHERE vendorId=${vendorId} AND invoiceNumber=${input.invoiceNumber} LIMIT 1`);const item=inserted[0];await tx.auditLog.create({data:{userId:actorId(request),action:'VENDOR_INVOICE_ADDED',entity:'Vendor',entityId:String(vendorId),afterJson:{invoiceId:Number(item.id),invoiceNumber:item.invoiceNumber,amount:Number(item.amount),status:item.status,purchaseOrderId:links.purchaseOrderId,goodsReceiptId:links.goodsReceiptId}}});return item;});
    return reply.code(201).send({data:{...data,id:Number(data.id),vendorId:Number(data.vendorId),outsourceOrderId:data.outsourceOrderId==null?null:Number(data.outsourceOrderId),purchaseOrderId:data.purchaseOrderId==null?null:Number(data.purchaseOrderId),goodsReceiptId:data.goodsReceiptId==null?null:Number(data.goodsReceiptId),amount:Number(data.amount)}});
  });
}
