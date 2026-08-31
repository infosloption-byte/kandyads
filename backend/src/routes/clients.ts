import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

const createClientSchema = z.object({
  code: z.string().min(2).max(50),
  companyName: z.string().min(2).max(200),
  contactName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  industry: z.string().max(120).optional(),
  paymentTerms: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

const listClientQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function registerClientRoutes(app: FastifyInstance) {
  app.get('/api/v1/clients', async (request) => {
    const query = listClientQuerySchema.parse(request.query);
    const where = query.search
      ? { OR: [
          { companyName: { contains: query.search } },
          { contactName: { contains: query.search } },
          { code: { contains: query.search } },
        ] }
      : {};

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.client.count({ where }),
    ]);

    return { data: items, meta: { page: query.page, pageSize: query.pageSize, total } };
  });

  app.post('/api/v1/clients', async (request, reply) => {
    const input = createClientSchema.parse(request.body);
    const existing = await prisma.client.findUnique({ where: { code: input.code } });
    if (existing) return reply.conflict('Client code already exists');

    const client = await prisma.client.create({ data: input });
    return reply.code(201).send({ data: client });
  });
}
