import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const createSchema = z.object({
  number: z.string().min(2).max(50),
  projectId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  priority: z.string().max(30).optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  assignmentType: z.enum(['INTERNAL', 'OUTSOURCED', 'MIXED']).optional(),
  revenue: z.coerce.number().nonnegative().default(0),
  estimatedMaterial: z.coerce.number().nonnegative().default(0),
  estimatedLabour: z.coerce.number().nonnegative().default(0),
  estimatedOutsource: z.coerce.number().nonnegative().default(0),
  estimatedExpense: z.coerce.number().nonnegative().default(0),
});

export async function jobsRoutes(app: FastifyInstance) {
  app.get('/api/v1/jobs', async (request) => {
    const q = z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      projectId: z.coerce.number().int().positive().optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);

    const where = {
      ...(q.status ? { status: q.status as any } : {}),
      ...(q.projectId ? { projectId: q.projectId } : {}),
      ...(q.search ? { OR: [{ number: { contains: q.search } }, { title: { contains: q.search } }] } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          project: { include: { client: true } },
          service: true,
          assignments: { include: { employee: true, vendor: true } },
          tasks: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.job.count({ where }),
    ]);

    return { data: items, meta: { page: q.page, pageSize: q.pageSize, total } };
  });

  app.get('/api/v1/jobs/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const item = await prisma.job.findUnique({
      where: { id },
      include: {
        project: { include: { client: true } },
        service: true,
        tasks: { include: { employee: true } },
        assignments: { include: { employee: true, vendor: true } },
        materialRequirements: { include: { material: true } },
        outsourceOrders: { include: { vendor: true } },
        expenses: { include: { category: true } },
        timeEntries: { include: { employee: true, task: true }, orderBy: { workDate: 'desc' } },
        installations: true,
      },
    });

    if (!item) return reply.notFound('Job not found');
    return { data: item };
  });

  app.post('/api/v1/jobs', async (request, reply) => {
    const input = createSchema.parse(request.body);
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) return reply.badRequest('Project not found');

    const item = await prisma.job.create({
      data: input,
      include: { project: { include: { client: true } }, service: true },
    });

    return reply.code(201).send({ data: item });
  });
}
