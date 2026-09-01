import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const warehouseSchema = z.object({ name: z.string().min(1).max(150), address: z.string().optional().nullable() });
const movementSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  warehouseId: z.coerce.number().int().positive(),
  type: z.enum(['PURCHASE_RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'WASTE']),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
});

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/api/v1/warehouses', async () => {
    const data = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
    return { data };
  });

  app.post('/api/v1/warehouses', async (request, reply) => {
    const input = warehouseSchema.parse(request.body);
    const data = await prisma.warehouse.create({ data: input });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/stock-movements', async (request) => {
    const query = z.object({ materialId: z.coerce.number().int().positive().optional(), warehouseId: z.coerce.number().int().positive().optional(), type: z.string().optional() }).parse(request.query);
    const data = await prisma.stockMovement.findMany({
      where: {
        materialId: query.materialId,
        warehouseId: query.warehouseId,
        type: query.type as any,
      },
      include: { material: true, warehouse: true, project: true, job: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { data };
  });

  app.post('/api/v1/stock-movements', async (request, reply) => {
    const input = movementSchema.parse(request.body);
    const data = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: input.materialId } });
      const warehouse = await tx.warehouse.findUnique({ where: { id: input.warehouseId } });
      if (!material) throw app.httpErrors.notFound('Material not found');
      if (!warehouse) throw app.httpErrors.notFound('Warehouse not found');
      return tx.stockMovement.create({ data: input });
    });
    return reply.code(201).send({ data });
  });
}
