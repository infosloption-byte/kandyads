import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const requestSchema = z.object({
  number: z.string().min(1).max(50),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  requestedById: z.coerce.number().int().positive().optional().nullable(),
  preferredVendorId: z.coerce.number().int().positive().optional().nullable(),
  requiredBy: z.string().datetime().optional().nullable(),
  purpose: z.string().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED']).optional(),
  items: z.array(z.object({
    materialId: z.coerce.number().int().positive(),
    requestedQty: z.coerce.number().positive(),
    estimatedUnitCost: z.coerce.number().nonnegative().optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  })).min(1),
});

const orderSchema = z.object({
  number: z.string().min(1).max(50),
  vendorId: z.coerce.number().int().positive(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  jobId: z.coerce.number().int().positive().optional().nullable(),
  purchaseRequestId: z.coerce.number().int().positive().optional().nullable(),
  orderDate: z.string().datetime(),
  expectedDate: z.string().datetime().optional().nullable(),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  status: z.enum(['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    materialId: z.coerce.number().int().positive(),
    description: z.string().min(1).max(500),
    quantity: z.coerce.number().positive(),
    unit: z.string().min(1).max(30),
    unitCost: z.coerce.number().nonnegative(),
    total: z.coerce.number().nonnegative(),
  })).min(1),
});

const receiptSchema = z.object({
  number: z.string().min(1).max(50),
  purchaseOrderId: z.coerce.number().int().positive(),
  warehouseId: z.coerce.number().int().positive(),
  receivedDate: z.string().datetime(),
  supplierReference: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    purchaseOrderItemId: z.coerce.number().int().positive(),
    receivedQty: z.coerce.number().positive(),
    unitCost: z.coerce.number().nonnegative(),
  })).min(1),
});

export async function purchasingRoutes(app: FastifyInstance) {
  app.get('/api/v1/purchase-requests', async (request) => {
    const query = z.object({ status: z.string().optional(), q: z.string().optional() }).parse(request.query);
    const data = await prisma.purchaseRequest.findMany({
      where: {
        status: query.status as any,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { purpose: { contains: query.q } }] } : {}),
      },
      include: { project: true, job: true, requestedBy: true, preferredVendor: true, items: { include: { material: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/purchase-requests', async (request, reply) => {
    const input = requestSchema.parse(request.body);
    const { items, requiredBy, ...header } = input;
    const data = await prisma.purchaseRequest.create({
      data: {
        ...header,
        requiredBy: requiredBy ? new Date(requiredBy) : null,
        status: input.status ?? 'DRAFT',
        items: { create: items },
      },
      include: { items: { include: { material: true } } },
    });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/purchase-orders', async (request) => {
    const query = z.object({ status: z.string().optional(), vendorId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.purchaseOrder.findMany({
      where: { status: query.status as any, vendorId: query.vendorId },
      include: { vendor: true, project: true, job: true, purchaseRequest: true, items: { include: { material: true } }, goodsReceipts: true },
      orderBy: { orderDate: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/purchase-orders', async (request, reply) => {
    const input = orderSchema.parse(request.body);
    const { items, orderDate, expectedDate, ...header } = input;
    const data = await prisma.purchaseOrder.create({
      data: {
        ...header,
        orderDate: new Date(orderDate),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        status: input.status ?? 'DRAFT',
        items: { create: items },
      },
      include: { vendor: true, items: { include: { material: true } } },
    });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/goods-receipts', async () => {
    const data = await prisma.goodsReceipt.findMany({
      include: { purchaseOrder: { include: { vendor: true } }, warehouse: true, items: { include: { material: true, purchaseOrderItem: true } } },
      orderBy: { receivedDate: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/goods-receipts', async (request, reply) => {
    const input = receiptSchema.parse(request.body);
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId }, include: { items: true } });
      if (!order) throw app.httpErrors.notFound('Purchase order not found');
      const warehouse = await tx.warehouse.findUnique({ where: { id: input.warehouseId } });
      if (!warehouse) throw app.httpErrors.notFound('Warehouse not found');

      for (const item of input.items) {
        const poItem = order.items.find((candidate) => candidate.id === item.purchaseOrderItemId);
        if (!poItem) throw app.httpErrors.badRequest('Goods receipt item does not belong to the purchase order');
        if (Number(poItem.receivedQty) + item.receivedQty > Number(poItem.quantity)) {
          throw app.httpErrors.badRequest(`Received quantity exceeds ordered quantity for ${poItem.description}`);
        }
      }

      const receipt = await tx.goodsReceipt.create({
        data: {
          number: input.number,
          purchaseOrderId: input.purchaseOrderId,
          warehouseId: input.warehouseId,
          receivedDate: new Date(input.receivedDate),
          status: 'POSTED',
          supplierReference: input.supplierReference,
          notes: input.notes,
          items: {
            create: input.items.map((item) => {
              const poItem = order.items.find((candidate) => candidate.id === item.purchaseOrderItemId)!;
              return {
                receivedQty: item.receivedQty,
                unitCost: item.unitCost,
                purchaseOrderItem: { connect: { id: item.purchaseOrderItemId } },
                material: { connect: { id: poItem.materialId } },
              };
            }),
          },
        },
        include: { items: true },
      });

      for (const item of input.items) {
        const poItem = order.items.find((candidate) => candidate.id === item.purchaseOrderItemId)!;
        const nextReceived = Number(poItem.receivedQty) + item.receivedQty;
        await tx.purchaseOrderItem.update({ where: { id: poItem.id }, data: { receivedQty: nextReceived } });
        await tx.stockMovement.create({
          data: {
            materialId: poItem.materialId,
            warehouseId: input.warehouseId,
            type: 'PURCHASE_RECEIPT',
            quantity: item.receivedQty,
            unitCost: item.unitCost,
            projectId: order.projectId,
            jobId: order.jobId,
            reference: input.number,
          },
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: order.id } });
      const fullyReceived = refreshedItems.every((item) => Number(item.receivedQty) >= Number(item.quantity));
      const partiallyReceived = refreshedItems.some((item) => Number(item.receivedQty) > 0);
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: fullyReceived ? 'RECEIVED' : partiallyReceived ? 'PARTIALLY_RECEIVED' : order.status },
      });
      return receipt;
    });
    return reply.code(201).send({ data: result });
  });
}
