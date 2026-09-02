import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { actorId, writeAudit } from '../audit/audit.service.js';

const movementTypes = ['PURCHASE_RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'WASTE'] as const;
const warehouseSchema = z.object({ name: z.string().min(1).max(150), address: z.string().optional().nullable() });
const movementSchema = z.object({
  materialId: z.coerce.number().int().positive(),
  warehouseId: z.coerce.number().int().positive(),
  type: z.enum(movementTypes),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
});
const ledgerQuerySchema = z.object({
  materialId: z.coerce.number().int().positive().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  type: z.enum(movementTypes).optional(),
  projectId: z.coerce.number().int().positive().optional(),
  jobId: z.coerce.number().int().positive().optional(),
  reference: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

function signedQuantity(type: string, quantity: unknown) {
  const value = Number(quantity);
  if (type === 'ISSUE' || type === 'WASTE') return -value;
  if (type === 'TRANSFER') return 0;
  return value;
}

async function stockSummary(active?: boolean) {
  const [materials, warehouses, movements, requirements] = await Promise.all([
    prisma.material.findMany({
      where: active === undefined ? undefined : { active },
      include: { category: true, preferredVendor: true },
      orderBy: { name: 'asc' },
    }),
    prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
    prisma.stockMovement.findMany({
      select: { materialId: true, warehouseId: true, type: true, quantity: true },
    }),
    prisma.materialRequirement.findMany({
      select: { materialId: true, reservedQty: true, job: { select: { status: true } } },
    }),
  ]);

  const reservedByMaterial = new Map<number, number>();
  for (const row of requirements) {
    if (row.job?.status === 'COMPLETED' || row.job?.status === 'CANCELLED') continue;
    const current = reservedByMaterial.get(row.materialId) ?? 0;
    reservedByMaterial.set(row.materialId, current + Number(row.reservedQty ?? 0));
  }

  const stockByMaterial = new Map<number, number>();
  const stockByMaterialWarehouse = new Map<string, number>();
  for (const row of movements) {
    const signed = signedQuantity(row.type, row.quantity);
    stockByMaterial.set(row.materialId, (stockByMaterial.get(row.materialId) ?? 0) + signed);
    if (row.type !== 'TRANSFER') {
      const key = `${row.materialId}:${row.warehouseId}`;
      stockByMaterialWarehouse.set(key, (stockByMaterialWarehouse.get(key) ?? 0) + signed);
    }
  }

  return materials.map((material) => {
    const stockOnHand = Number((stockByMaterial.get(material.id) ?? 0).toFixed(3));
    const reservedQty = Number((reservedByMaterial.get(material.id) ?? 0).toFixed(3));
    const availableQty = Number((stockOnHand - reservedQty).toFixed(3));
    const reorderLevel = Number(material.reorderLevel ?? 0);
    const reorderAlert = reorderLevel > 0 && availableQty <= reorderLevel;
    return {
      id: material.id,
      sku: material.sku,
      name: material.name,
      unit: material.unit,
      category: material.category,
      preferredVendor: material.preferredVendor,
      stockOnHand,
      reservedQty,
      availableQty,
      reorderLevel,
      minimumStock: Number(material.minimumStock ?? 0),
      reorderAlert,
      warehouses: warehouses.map((warehouse) => ({
        id: warehouse.id,
        name: warehouse.name,
        quantity: Number((stockByMaterialWarehouse.get(`${material.id}:${warehouse.id}`) ?? 0).toFixed(3)),
      })),
    };
  });
}

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

  app.get('/api/v1/inventory/stock-summary', async (request) => {
    const query = z.object({ active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const data = await stockSummary(query.active === undefined ? undefined : query.active === 'true');
    return { data };
  });

  app.get('/api/v1/inventory/reorder-alerts', async (request) => {
    const query = z.object({ active: z.enum(['true', 'false']).optional() }).parse(request.query);
    const data = await stockSummary(query.active === undefined ? true : query.active === 'true');
    return { data: data.filter((row) => row.reorderAlert) };
  });

  app.get('/api/v1/stock-movements', async (request) => {
    const query = ledgerQuerySchema.parse(request.query);
    const where = {
      ...(query.materialId ? { materialId: query.materialId } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
      ...(query.reference ? { reference: { contains: query.reference } } : {}),
      ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { material: true, warehouse: true, project: true, job: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return {
      data: items.map((row) => ({ ...row, signedQuantity: Number(signedQuantity(row.type, row.quantity).toFixed(3)) })),
      meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  });

  app.post('/api/v1/stock-movements', async (request, reply) => {
    const input = movementSchema.parse(request.body);
    const userId = actorId(request);
    const data = await prisma.$transaction(async (tx) => {
      const [material, warehouse] = await Promise.all([
        tx.material.findUnique({ where: { id: input.materialId } }),
        tx.warehouse.findUnique({ where: { id: input.warehouseId } }),
      ]);
      if (!material) throw app.httpErrors.notFound('Material not found');
      if (!warehouse) throw app.httpErrors.notFound('Warehouse not found');
      if (input.projectId) {
        const project = await tx.project.findUnique({ where: { id: input.projectId } });
        if (!project) throw app.httpErrors.badRequest('Project not found');
      }
      if (input.jobId) {
        const job = await tx.job.findUnique({ where: { id: input.jobId } });
        if (!job) throw app.httpErrors.badRequest('Job not found');
      }
      const movement = await tx.stockMovement.create({ data: input });
      await writeAudit(tx, {
        userId,
        action: 'STOCK_MOVEMENT_CREATED',
        entity: 'StockMovement',
        entityId: movement.id,
        beforeJson: null,
        afterJson: {
          id: movement.id,
          materialId: movement.materialId,
          warehouseId: movement.warehouseId,
          type: movement.type,
          quantity: movement.quantity.toString(),
          unitCost: movement.unitCost?.toString() ?? null,
          projectId: movement.projectId,
          jobId: movement.jobId,
          reference: movement.reference,
        },
      });
      return movement;
    });
    return reply.code(201).send({ data });
  });
}
