import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const vendorSchema = z.object({
  code: z.string().min(1).max(50),
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(150).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  email: z.string().email().max(191).optional().nullable(),
  address: z.string().optional().nullable(),
  category: z.string().max(150).optional().nullable(),
  capabilities: z.string().optional().nullable(),
  paymentTerms: z.string().max(150).optional().nullable(),
  bankDetails: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export async function vendorsRoutes(app: FastifyInstance) {
  app.get('/api/v1/vendors', async (request) => {
    const query = z.object({ q: z.string().optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const data = await prisma.vendor.findMany({
      where: {
        active: query.active ? query.active === 'true' : undefined,
        ...(query.q ? { OR: [{ code: { contains: query.q } }, { companyName: { contains: query.q } }, { category: { contains: query.q } }] } : {}),
      },
      include: { _count: { select: { assignments: true, outsourceOrders: true } } },
      orderBy: { companyName: 'asc' },
    });
    return { data };
  });

  app.post('/api/v1/vendors', async (request, reply) => {
    const input = vendorSchema.parse(request.body);
    const data = await prisma.vendor.create({ data: input });
    return reply.code(201).send({ data });
  });
}
