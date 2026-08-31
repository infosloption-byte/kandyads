import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema=z.object({number:z.string().min(2).max(50),clientId:z.coerce.number().int().positive(),source:z.string().max(80).optional(),requirement:z.string().min(2).max(5000),siteLocation:z.string().max(500).optional(),targetDate:z.coerce.date().optional(),priority:z.string().max(30).optional()});

export async function enquiriesRoutes(app: FastifyInstance){
  app.get('/api/v1/enquiries',async request=>{const q=z.object({search:z.string().optional(),status:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);const where={...(q.status?{status:q.status as any}:{}),...(q.search?{OR:[{number:{contains:q.search}},{requirement:{contains:q.search}}]}:{})};const [items,total]=await Promise.all([prisma.enquiry.findMany({where,include:{client:true,quote:true},orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.enquiry.count({where})]);return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};});
  app.post('/api/v1/enquiries',async(request,reply)=>{const input=createSchema.parse(request.body);const item=await prisma.enquiry.create({data:input});return reply.code(201).send({data:item});});
}
