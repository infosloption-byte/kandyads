import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const materialSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  unit: z.string().min(1).max(30),
  standardCost: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative().optional().nullable(),
  reorderLevel: z.coerce.number().nonnegative().optional().default(0),
  minimumStock: z.coerce.number().nonnegative().optional().default(0),
  preferredVendorId: z.coerce.number().int().positive().optional().nullable(),
});

const categorySchema = z.object({ name: z.string().min(1).max(150) });

export async function materialsRoutes(app: FastifyInstance) {
  app.get('/api/v1/material-categories', async () => {
    const data = await prisma.materialCategory.findMany({ orderBy: { name: 'asc' } });
    return { data };
  });

  app.post('/api/v1/material-categories', async (request, reply) => {
    const input = categorySchema.parse(request.body);
    const data = await prisma.materialCategory.create({ data: input });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/materials', async (request) => {
    const query = z.object({ q: z.string().optional(), active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const materials = await prisma.material.findMany({
      where: {
        active: query.active ? query.active === 'true' : undefined,
        ...(query.q ? { OR: [{ sku: { contains: query.q } }, { name: { contains: query.q } }] } : {}),
      },
      include: { category: true, preferredVendor: true },
      orderBy: { name: 'asc' },
    });

    const movementTotals = await prisma.stockMovement.groupBy({
      by: ['materialId', 'type'],
      _sum: { quantity: true },
    });

    const data = materials.map((material) => {
      const totals = movementTotals.filter((row) => row.materialId === material.id);
      const signed = totals.reduce((sum, row) => {
        const qty = Number(row._sum.quantity ?? 0);
        return ['ISSUE', 'WASTE'].includes(row.type) ? sum - qty : ['TRANSFER'].includes(row.type) ? sum : sum + qty;
      }, 0);
      return { ...material, stockOnHand: Number(signed.toFixed(3)) };
    });

    return { data };
  });

  app.post('/api/v1/materials', async (request, reply) => {
    const input = materialSchema.parse(request.body);
    const data = await prisma.material.create({ data: input });
    return reply.code(201).send({ data });
  });
}
