import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema=z.object({number:z.string().min(2).max(50),name:z.string().min(2).max(200),clientId:z.coerce.number().int().positive(),quoteId:z.coerce.number().int().positive().optional(),ownerId:z.coerce.number().int().positive().optional(),startDate:z.coerce.date().optional(),dueDate:z.coerce.date().optional(),value:z.coerce.number().nonnegative().default(0)});

export async function projectsRoutes(app:FastifyInstance){
  app.get('/api/v1/projects',async request=>{const q=z.object({search:z.string().optional(),status:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);const where={...(q.status?{status:q.status as any}:{}),...(q.search?{OR:[{number:{contains:q.search}},{name:{contains:q.search}}]}:{})};const [items,total]=await Promise.all([prisma.project.findMany({where,include:{client:true,quote:true,owner:true,jobs:true},orderBy:{createdAt:'desc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.project.count({where})]);return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};});
  app.post('/api/v1/projects',async(request,reply)=>{const input=createSchema.parse(request.body);const item=await prisma.project.create({data:input,include:{client:true,quote:true,owner:true}});return reply.code(201).send({data:item});});
}
