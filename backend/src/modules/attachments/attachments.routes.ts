import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const entityTypes = ['CLIENT','LEAD','ENQUIRY','QUOTE','PROJECT','JOB','TASK','EMPLOYEE','VENDOR','PURCHASE_REQUEST','PURCHASE_ORDER','EXPENSE','INSTALLATION','INVOICE'] as const;
const createSchema=z.object({entityType:z.enum(entityTypes),entityId:z.coerce.number().int().positive(),name:z.string().trim().min(1).max(255),description:z.string().max(2000).optional().nullable(),mimeType:z.string().max(120).optional().nullable(),sizeBytes:z.coerce.number().int().nonnegative().optional().nullable(),storageKey:z.string().max(500).optional().nullable(),url:z.string().url().max(1000).optional().nullable()}).refine(v=>Boolean(v.storageKey||v.url),{message:'Either storageKey or url is required'});
const listSchema=z.object({entityType:z.enum(entityTypes),entityId:z.coerce.number().int().positive()});

function actorId(request:FastifyRequest){const id=Number((request.user as {sub?:string}).sub);return Number.isInteger(id)&&id>0?id:null;}
async function entityExists(entityType:(typeof entityTypes)[number],id:number){
  const checks:Record<string,(id:number)=>Promise<boolean>>={
    CLIENT:async x=>!!await prisma.client.findUnique({where:{id:x},select:{id:true}}),
    LEAD:async x=>!!await prisma.lead.findUnique({where:{id:x},select:{id:true}}),
    ENQUIRY:async x=>!!await prisma.enquiry.findUnique({where:{id:x},select:{id:true}}),
    QUOTE:async x=>!!await prisma.quote.findUnique({where:{id:x},select:{id:true}}),
    PROJECT:async x=>!!await prisma.project.findUnique({where:{id:x},select:{id:true}}),
    JOB:async x=>!!await prisma.job.findUnique({where:{id:x},select:{id:true}}),
    TASK:async x=>!!await prisma.task.findUnique({where:{id:x},select:{id:true}}),
    EMPLOYEE:async x=>!!await prisma.employee.findUnique({where:{id:x},select:{id:true}}),
    VENDOR:async x=>!!await prisma.vendor.findUnique({where:{id:x},select:{id:true}}),
    PURCHASE_REQUEST:async x=>!!await prisma.purchaseRequest.findUnique({where:{id:x},select:{id:true}}),
    PURCHASE_ORDER:async x=>!!await prisma.purchaseOrder.findUnique({where:{id:x},select:{id:true}}),
    EXPENSE:async x=>!!await prisma.expense.findUnique({where:{id:x},select:{id:true}}),
    INSTALLATION:async x=>!!await prisma.installation.findUnique({where:{id:x},select:{id:true}}),
    INVOICE:async x=>!!await prisma.invoice.findUnique({where:{id:x},select:{id:true}}),
  };
  return checks[entityType](id);
}

export async function attachmentsRoutes(app:FastifyInstance){
  app.get('/api/v1/attachments',async request=>{
    const q=listSchema.parse(request.query);
    const data=await prisma.attachment.findMany({where:{entityType:q.entityType,entityId:q.entityId},include:{uploadedBy:{select:{id:true,name:true,email:true}}},orderBy:{createdAt:'desc'}});
    return {data};
  });
  app.post('/api/v1/attachments',async(request,reply)=>{
    const input=createSchema.parse(request.body);
    if(!await entityExists(input.entityType,input.entityId))return reply.badRequest(`Related ${input.entityType} record not found`);
    const data=await prisma.$transaction(async tx=>{
      const item=await tx.attachment.create({data:{...input,uploadedById:actorId(request)}});
      await tx.auditLog.create({data:{userId:actorId(request),action:'ATTACHMENT_ADDED',entity:input.entityType,entityId:String(input.entityId),afterJson:{attachmentId:item.id,name:item.name,url:item.url,storageKey:item.storageKey}}});
      return item;
    });
    return reply.code(201).send({data});
  });
}
