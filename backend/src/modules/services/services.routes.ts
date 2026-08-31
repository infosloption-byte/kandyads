import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function servicesRoutes(app: FastifyInstance) {
  app.get('/api/v1/services', async request => {
    const q = z.object({ search: z.string().optional(), pageSize: z.coerce.number().int().min(1).max(100).default(100) }).parse(request.query);
    const where = { active: true, ...(q.search ? { OR: [{ name: { contains: q.search } }, { slug: { contains: q.search } }] } : {}) };
    const items = await prisma.service.findMany({ where, orderBy: { name: 'asc' }, take: q.pageSize });
    return { data: items, meta: { total: items.length } };
  });

  app.post('/api/v1/services', async (request, reply) => {
    const input = z.object({ name: z.string().min(2).max(160), slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/), description: z.string().max(2000).optional() }).parse(request.body);
    const item = await prisma.service.create({ data: input });
    return reply.code(201).send({ data: item });
  });
}
