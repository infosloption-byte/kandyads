import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  code: z.string().min(2).max(50), companyName: z.string().min(2).max(200), contactName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(), whatsapp: z.string().max(40).optional(), email: z.string().email().optional(), address: z.string().max(500).optional(),
  industry: z.string().max(120).optional(), paymentTerms: z.string().max(200).optional(), notes: z.string().max(2000).optional(),
});

export async function clientsRoutes(app: FastifyInstance){
  app.get('/api/v1/clients', async request => {
    const q=z.object({search:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);
    const where=q.search?{OR:[{companyName:{contains:q.search}},{contactName:{contains:q.search}},{code:{contains:q.search}}]}:{};
    const [items,total]=await Promise.all([prisma.client.findMany({where,orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.client.count({where})]);
    return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};
  });
  app.get('/api/v1/clients/:id', async(request,reply)=>{const id=z.coerce.number().int().positive().parse((request.params as any).id);const item=await prisma.client.findUnique({where:{id},include:{projects:true,quotes:true,invoices:true}});if(!item)return reply.notFound('Client not found');return {data:item};});
  app.post('/api/v1/clients', async(request,reply)=>{const input=createSchema.parse(request.body);const item=await prisma.client.create({data:input});return reply.code(201).send({data:item});});
}
