import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  code: z.string().min(2).max(50), companyName: z.string().min(2).max(200), contactName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(), whatsapp: z.string().max(40).optional(), email: z.string().email().optional(), address: z.string().max(500).optional(),
  industry: z.string().max(120).optional(), paymentTerms: z.string().max(200).optional(), creditLimit: z.coerce.number().nonnegative().optional().nullable(), notes: z.string().max(2000).optional(),
  active: z.boolean().optional(),
});
const updateSchema = createSchema.partial().omit({ code: true });
function actorId(request: FastifyRequest){const id=Number((request.user as {sub?:string}).sub);return Number.isInteger(id)&&id>0?id:null;}
async function audit(request:FastifyRequest,action:string,id:number,before:unknown,after:unknown){await prisma.auditLog.create({data:{userId:actorId(request),action,entity:'Client',entityId:String(id),beforeJson:before as any,afterJson:after as any}});}

export async function clientsRoutes(app: FastifyInstance){
  app.get('/api/v1/clients', async request => {
    const q=z.object({search:z.string().optional(),active:z.enum(['true','false']).optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);
    const where={active:q.active===undefined?undefined:q.active==='true',...(q.search?{OR:[{companyName:{contains:q.search}},{contactName:{contains:q.search}},{code:{contains:q.search}}]}:{})};
    const [items,total]=await Promise.all([prisma.client.findMany({where,orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.client.count({where})]);
    return {data:items,meta:{page:q.page,pageSize:q.pageSize,total,totalPages:Math.ceil(total/q.pageSize)}};
  });
  app.get('/api/v1/clients/:id', async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const item=await prisma.client.findUnique({where:{id},include:{projects:{orderBy:{createdAt:'desc'}},quotes:{orderBy:{createdAt:'desc'}},invoices:{orderBy:{createdAt:'desc'}}}});if(!item)return reply.notFound('Client not found');return {data:item};});
  app.post('/api/v1/clients', async(request,reply)=>{const input=createSchema.parse(request.body);const exists=await prisma.client.findUnique({where:{code:input.code}});if(exists)return reply.conflict('Client code already exists');const item=await prisma.client.create({data:input});await audit(request,'CREATE',item.id,null,item);return reply.code(201).send({data:item});});
  app.patch('/api/v1/clients/:id', async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const input=updateSchema.parse(request.body);const existing=await prisma.client.findUnique({where:{id}});if(!existing)return reply.notFound('Client not found');const item=await prisma.client.update({where:{id},data:input});await audit(request,'UPDATE',id,existing,item);return {data:item};});
}
