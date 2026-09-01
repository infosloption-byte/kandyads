import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const categorySchema = z.object({ name: z.string().min(1).max(150) });
const expenseSchema = z.object({
  number: z.string().min(1).max(50),
  categoryId: z.coerce.number().int().positive(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  employeeId: z.coerce.number().int().positive().optional().nullable(),
  amount: z.coerce.number().nonnegative(),
  expenseDate: z.coerce.date(),
  paymentMethod: z.string().max(100).optional().nullable(),
  receiptUrl: z.string().max(500).optional().nullable(),
  direct: z.boolean().optional().default(false),
  status: z.enum(['DRAFT','SUBMITTED','APPROVED','REJECTED','PAID']).optional().default('DRAFT'),
  notes: z.string().optional().nullable(),
});

export async function expensesRoutes(app: FastifyInstance) {
  app.get('/api/v1/expense-categories', async () => {
    const data = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    return { data };
  });

  app.post('/api/v1/expense-categories', async (request, reply) => {
    const input = categorySchema.parse(request.body);
    const data = await prisma.expenseCategory.create({ data: input });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/expenses', async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional(), projectId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.expense.findMany({
      where: {
        status: query.status as any,
        projectId: query.projectId,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { notes: { contains: query.q } }] } : {}),
      },
      include: { category: true, project: true, job: true, employee: true },
      orderBy: { expenseDate: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/expenses', async (request, reply) => {
    const input = expenseSchema.parse(request.body);
    const data = await prisma.expense.create({ data: input });
    return reply.code(201).send({ data });
  });
}
