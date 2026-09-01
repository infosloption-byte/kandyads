import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const outsourceSchema = z.object({
  number: z.string().min(1).max(50),
  jobId: z.coerce.number().int().positive(),
  vendorId: z.coerce.number().int().positive(),
  scope: z.string().min(1),
  specification: z.string().optional().nullable(),
  quantity: z.coerce.number().positive().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  agreedCost: z.coerce.number().nonnegative(),
  status: z.enum(['REQUESTED','APPROVED','SENT','IN_PROGRESS','RECEIVED','REJECTED','CANCELLED']).optional().default('REQUESTED'),
});

export async function outsourcingRoutes(app: FastifyInstance) {
  app.get('/api/v1/outsourcing', async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional() }).parse(request.query);
    const data = await prisma.outsourceOrder.findMany({
      where: {
        status: query.status as any,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { scope: { contains: query.q } }] } : {}),
      },
      include: { job: { include: { project: true } }, vendor: true },
      orderBy: { id: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/outsourcing', async (request, reply) => {
    const input = outsourceSchema.parse(request.body);
    const data = await prisma.outsourceOrder.create({ data: input });
    return reply.code(201).send({ data });
  });
}
