import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const vendorSchema = z.object({
  code: z.string().min(1).max(50),
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(150).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  email: z.string().email().max(191).optional().nullable(),
  address: z.string().optional().nullable(),
  category: z.string().max(150).optional().nullable(),
  capabilities: z.string().optional().nullable(),
  paymentTerms: z.string().max(150).optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
});
const deliverableSchema=z.object({type:z.string().trim().min(1).max(50),reference:z.string().trim().max(100).optional().nullable(),description:z.string().trim().min(1).max(500),deliveredAt:z.coerce.date().optional().nullable(),accepted:z.boolean().optional().default(false),notes:z.string().max(5000).optional().nullable(),outsourceOrderId:z.coerce.number().int().positive().optional().nullable()});
const invoiceSchema=z.object({invoiceNumber:z.string().trim().min(1).max(100),invoiceDate:z.coerce.date(),dueDate:z.coerce.date().optional().nullable(),amount:z.coerce.number().nonnegative(),status:z.enum(['RECEIVED','VERIFIED','PAID','DISPUTED','CANCELLED']).default('RECEIVED'),notes:z.string().max(5000).optional().nullable(),outsourceOrderId:z.coerce.number().int().positive().optional().nullable()});
function actorId(request:FastifyRequest){const id=Number((request.user as {sub?:string}).sub);return Number.isInteger(id)&&id>0?id:null;}

export async function vendorsRoutes(app:FastifyInstance) {
  app.get('/api/v1/vendors', async (request) => {
    const query = z.object({ q: z.string().optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const data = await prisma.vendor.findMany({
      where: {
        active: query.active ? query.active === 'true' : undefined,
        ...(query.q ? { OR: [{ code: { contains: query.q } }, { companyName: { contains: query.q } }, { category: { contains: query.q } }] } : {}),
      },
      include: { _count: { select: { assignments: true, outsourceOrders: true } } },
      orderBy: { companyName: 'asc' },
    });
    return { data };
  });

  app.get('/api/v1/vendors/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: { select: { assignments: true, outsourceOrders: true } },
        assignments: { include: { job: true }, orderBy: { id: 'desc' }, take: 50 },
        outsourceOrders: { include: { job: true }, orderBy: { id: 'desc' }, take: 50 },
      },
    });
    if (!vendor) return reply.notFound('Vendor not found');
    const [attachments,deliverables,invoices]=await Promise.all([
      prisma.attachment.findMany({where:{entityType:'VENDOR',entityId:id},include:{uploadedBy:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:'desc'}}),
      prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT id,vendorId,outsourceOrderId,type,reference,description,deliveredAt,accepted,notes,createdAt,updatedAt FROM VendorDeliverable WHERE vendorId=${id} ORDER BY createdAt DESC`),
      prisma.$queryRaw<Array<any>>(Prisma.sql`SELECT id,vendorId,outsourceOrderId,invoiceNumber,invoiceDate,dueDate,amount,status,notes,createdAt,updatedAt FROM VendorInvoice WHERE vendorId=${id} ORDER BY invoiceDate DESC, id DESC`),
    ]);
    return { data: { ...vendor, attachments, deliverables:deliverables.map(row=>({...row,id:Number(row.id),vendorId:Number(row.vendorId),outsourceOrderId:row.outsourceOrderId==null?null:Number(row.outsourceOrderId),accepted:Boolean(row.accepted)})), invoices:invoices.map(row=>({...row,id:Number(row.id),vendorId:Number(row.vendorId),outsourceOrderId:row.outsourceOrderId==null?null:Number(row.outsourceOrderId),amount:Number(row.amount)})) } };
  });

  app.post('/api/v1/vendors', async (request, reply) => {
    const input = vendorSchema.parse(request.body);
    const data = await prisma.vendor.create({ data: input });
    return reply.code(201).send({ data });
  });

  app.post('/api/v1/vendors/:id/deliverables',async(request,reply)=>{
    const vendorId=z.coerce.number().int().positive().parse((request.params as any).id);
    const input=deliverableSchema.parse(request.body);
    const vendor=await prisma.vendor.findUnique({where:{id:vendorId},select:{id:true}});if(!vendor)return reply.notFound('Vendor not found');
    if(input.outsourceOrderId){const order=await prisma.outsourceOrder.findFirst({where:{id:input.outsourceOrderId,vendorId},select:{id:true}});if(!order)return reply.badRequest('Outsource order not found for this vendor');}
    const data=await prisma.$transaction(async tx=>{
      await tx.$executeRaw(Prisma.sql`INSERT INTO VendorDeliverable (vendorId,outsourceOrderId,type,reference,description,deliveredAt,accepted,notes) VALUES (${vendorId},${input.outsourceOrderId??null},${input.type},${input.reference??null},${input.description},${input.deliveredAt??null},${input.accepted},${input.notes??null})`);
      const inserted=await tx.$queryRaw<Array<any>>(Prisma.sql`SELECT * FROM VendorDeliverable WHERE vendorId=${vendorId} ORDER BY id DESC LIMIT 1`);
      const item=inserted[0];
      await tx.auditLog.create({data:{userId:actorId(request),action:'VENDOR_DELIVERABLE_ADDED',entity:'Vendor',entityId:String(vendorId),afterJson:{deliverableId:Number(item.id),outsourceOrderId:item.outsourceOrderId==null?null:Number(item.outsourceOrderId),type:item.type,accepted:Boolean(item.accepted)}}});
      return item;
    });
    return reply.code(201).send({data:{...data,id:Number(data.id),vendorId:Number(data.vendorId),outsourceOrderId:data.outsourceOrderId==null?null:Number(data.outsourceOrderId),accepted:Boolean(data.accepted)}});
  });

  app.post('/api/v1/vendors/:id/invoices',async(request,reply)=>{
    const vendorId=z.coerce.number().int().positive().parse((request.params as any).id);
    const input=invoiceSchema.parse(request.body);
    const vendor=await prisma.vendor.findUnique({where:{id:vendorId},select:{id:true}});if(!vendor)return reply.notFound('Vendor not found');
    if(input.outsourceOrderId){const order=await prisma.outsourceOrder.findFirst({where:{id:input.outsourceOrderId,vendorId},select:{id:true}});if(!order)return reply.badRequest('Outsource order not found for this vendor');}
    const duplicate=await prisma.$queryRaw<Array<{id:number}>>(Prisma.sql`SELECT id FROM VendorInvoice WHERE vendorId=${vendorId} AND invoiceNumber=${input.invoiceNumber} LIMIT 1`);if(duplicate.length)return reply.conflict('Supplier invoice number already exists for this vendor');
    const data=await prisma.$transaction(async tx=>{
      await tx.$executeRaw(Prisma.sql`INSERT INTO VendorInvoice (vendorId,outsourceOrderId,invoiceNumber,invoiceDate,dueDate,amount,status,notes) VALUES (${vendorId},${input.outsourceOrderId??null},${input.invoiceNumber},${input.invoiceDate},${input.dueDate??null},${input.amount},${input.status},${input.notes??null})`);
      const inserted=await tx.$queryRaw<Array<any>>(Prisma.sql`SELECT * FROM VendorInvoice WHERE vendorId=${vendorId} AND invoiceNumber=${input.invoiceNumber} LIMIT 1`);
      const item=inserted[0];
      await tx.auditLog.create({data:{userId:actorId(request),action:'VENDOR_INVOICE_ADDED',entity:'Vendor',entityId:String(vendorId),afterJson:{invoiceId:Number(item.id),invoiceNumber:item.invoiceNumber,amount:Number(item.amount),status:item.status}}});
      return item;
    });
    return reply.code(201).send({data:{...data,id:Number(data.id),vendorId:Number(data.vendorId),outsourceOrderId:data.outsourceOrderId==null?null:Number(data.outsourceOrderId),amount:Number(data.amount)}});
  });
}
