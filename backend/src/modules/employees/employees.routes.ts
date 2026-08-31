import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema=z.object({code:z.string().min(2).max(50),name:z.string().min(2).max(160),phone:z.string().max(40).optional(),email:z.string().email().optional(),department:z.string().max(120).optional(),employmentType:z.string().max(80).optional(),hourlyCost:z.coerce.number().nonnegative(),dailyCost:z.coerce.number().nonnegative().optional(),status:z.enum(['ACTIVE','INACTIVE']).optional()});
export async function employeesRoutes(app:FastifyInstance){
  app.get('/api/v1/employees',async request=>{const q=z.object({search:z.string().optional(),status:z.string().optional(),page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20)}).parse(request.query);const where={...(q.status?{status:q.status as any}:{}),...(q.search?{OR:[{code:{contains:q.search}},{name:{contains:q.search}},{department:{contains:q.search}}]}:{})};const [items,total]=await Promise.all([prisma.employee.findMany({where,orderBy:{name:'asc'},skip:(q.page-1)*q.pageSize,take:q.pageSize}),prisma.employee.count({where})]);return {data:items,meta:{page:q.page,pageSize:q.pageSize,total}};});
  app.post('/api/v1/employees',async(request,reply)=>{const input=createSchema.parse(request.body);const exists=await prisma.employee.findUnique({where:{code:input.code}});if(exists)return reply.conflict('Employee code already exists');const item=await prisma.employee.create({data:input});return reply.code(201).send({data:item});});
}
