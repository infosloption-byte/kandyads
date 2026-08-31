import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createProjectSchema = z.object({
  number: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  clientId: z.number().int().positive(),
  quoteId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  value: z.number().nonnegative().default(0),
});

export async function registerProjectRoutes(app: any) {
  app.get('/api/v1/projects', async (request: any) => {
    const query = z.object({ search: z.string().optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);
    const where = query.search ? { OR: [{ number: { contains: query.search } }, { name: { contains: query.search } }, { client: { companyName: { contains: query.search } } }] } : {};
    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, include: { client: { select: { id: true, companyName: true } }, owner: { select: { id: true, name: true } }, _count: { select: { jobs: true, invoices: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.project.count({ where }),
    ]);
    return { data: items, meta: { page: query.page, pageSize: query.pageSize, total } };
  });

  app.post('/api/v1/projects', async (request: any, reply: any) => {
    const input = createProjectSchema.parse(request.body);
    const project = await prisma.project.create({ data: { ...input, startDate: input.startDate ? new Date(input.startDate) : undefined, dueDate: input.dueDate ? new Date(input.dueDate) : undefined } });
    return reply.code(201).send({ data: project });
  });
}
