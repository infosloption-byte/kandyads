import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

function actorId(request: FastifyRequest) {
  const sub = (request.user as { sub?: string }).sub;
  const id = Number(sub);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function audit(request: FastifyRequest, action: string, entity: string, entityId: number | string, before: unknown, after: unknown) {
  await prisma.auditLog.create({
    data: {
      userId: actorId(request),
      action,
      entity,
      entityId: String(entityId),
      beforeJson: before as any,
      afterJson: after as any,
    },
  });
}

function serializeAuditLog(entry: any) {
  return {
    ...entry,
    id: typeof entry.id === 'bigint' ? entry.id.toString() : entry.id,
  };
}

const idSchema = z.coerce.number().int().positive();
const rejectSchema = z.object({ reason: z.string().min(2).max(500).optional() });

export async function approvalsRoutes(app: FastifyInstance) {
  app.get('/api/v1/approvals/summary', async () => {
    const [purchaseRequests, purchaseOrders, expenses, outsourcing, recentAudit] = await Promise.all([
      prisma.purchaseRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
      prisma.expense.count({ where: { status: 'SUBMITTED' } }),
      prisma.outsourceOrder.count({ where: { status: 'REQUESTED' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { id: true, name: true } } } }),
    ]);
    return { data: { purchaseRequests, purchaseOrders, expenses, outsourcing, recentAudit: recentAudit.map(serializeAuditLog) } };
  });

  app.get('/api/v1/approvals/pending', async () => {
    const [purchaseRequests, purchaseOrders, expenses, outsourcing, timeEntries] = await Promise.all([
      prisma.purchaseRequest.findMany({ where: { status: 'SUBMITTED' }, include: { project: true, job: true, requestedBy: true, preferredVendor: true, items: { include: { material: true } } }, orderBy: { createdAt: 'asc' } }),
      prisma.purchaseOrder.findMany({ where: { status: 'DRAFT' }, include: { vendor: true, project: true, job: true, items: { include: { material: true } } }, orderBy: { createdAt: 'asc' } }),
      prisma.expense.findMany({ where: { status: 'SUBMITTED' }, include: { category: true, project: true, job: true, employee: true }, orderBy: { createdAt: 'asc' } }),
      prisma.outsourceOrder.findMany({ where: { status: 'REQUESTED' }, include: { job: { include: { project: true } }, vendor: true }, orderBy: { id: 'asc' } }),
      prisma.timeEntry.findMany({ include: { employee: true, job: true, task: true }, orderBy: { workDate: 'asc' } }),
    ]);
    const timeIds = timeEntries.map((entry) => String(entry.id));
    const approved = timeIds.length
      ? await prisma.auditLog.findMany({ where: { entity: 'TimeEntry', entityId: { in: timeIds }, action: 'APPROVE' }, select: { entityId: true } })
      : [];
    const approvedIds = new Set(approved.map((x) => x.entityId));
    return { data: { purchaseRequests, purchaseOrders, expenses, outsourcing, timeEntries: timeEntries.filter((entry) => !approvedIds.has(String(entry.id))) } };
  });

  app.post('/api/v1/approvals/purchase-requests/:id/submit', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!item) return reply.notFound('Purchase request not found');
    if (!['DRAFT', 'REJECTED'].includes(item.status)) return reply.badRequest(`Cannot submit purchase request from ${item.status}`);
    const updated = await prisma.purchaseRequest.update({ where: { id }, data: { status: 'SUBMITTED' } });
    await audit(request, 'SUBMIT', 'PurchaseRequest', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/purchase-requests/:id/approve', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!item) return reply.notFound('Purchase request not found');
    if (item.status !== 'SUBMITTED') return reply.badRequest(`Cannot approve purchase request from ${item.status}`);
    const updated = await prisma.purchaseRequest.update({ where: { id }, data: { status: 'APPROVED' } });
    await audit(request, 'APPROVE', 'PurchaseRequest', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/purchase-requests/:id/reject', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const reason = rejectSchema.parse(request.body ?? {}).reason;
    const item = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!item) return reply.notFound('Purchase request not found');
    if (item.status !== 'SUBMITTED') return reply.badRequest(`Cannot reject purchase request from ${item.status}`);
    const updated = await prisma.purchaseRequest.update({ where: { id }, data: { status: 'REJECTED' } });
    await audit(request, 'REJECT', 'PurchaseRequest', id, { status: item.status }, { status: updated.status, reason });
    return { data: updated };
  });

  app.post('/api/v1/approvals/purchase-orders/:id/approve', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!item) return reply.notFound('Purchase order not found');
    if (item.status !== 'DRAFT') return reply.badRequest(`Cannot approve purchase order from ${item.status}`);
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'APPROVED' } });
    await audit(request, 'APPROVE', 'PurchaseOrder', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/purchase-orders/:id/send', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!item) return reply.notFound('Purchase order not found');
    if (item.status !== 'APPROVED') return reply.badRequest(`Cannot send purchase order from ${item.status}`);
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'SENT' } });
    await audit(request, 'SEND', 'PurchaseOrder', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/expenses/:id/submit', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.expense.findUnique({ where: { id } });
    if (!item) return reply.notFound('Expense not found');
    if (!['DRAFT', 'REJECTED'].includes(item.status)) return reply.badRequest(`Cannot submit expense from ${item.status}`);
    const updated = await prisma.expense.update({ where: { id }, data: { status: 'SUBMITTED' } });
    await audit(request, 'SUBMIT', 'Expense', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/expenses/:id/approve', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.expense.findUnique({ where: { id } });
    if (!item) return reply.notFound('Expense not found');
    if (item.status !== 'SUBMITTED') return reply.badRequest(`Cannot approve expense from ${item.status}`);
    const updated = await prisma.expense.update({ where: { id }, data: { status: 'APPROVED' } });
    await audit(request, 'APPROVE', 'Expense', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/expenses/:id/reject', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const reason = rejectSchema.parse(request.body ?? {}).reason;
    const item = await prisma.expense.findUnique({ where: { id } });
    if (!item) return reply.notFound('Expense not found');
    if (item.status !== 'SUBMITTED') return reply.badRequest(`Cannot reject expense from ${item.status}`);
    const updated = await prisma.expense.update({ where: { id }, data: { status: 'REJECTED' } });
    await audit(request, 'REJECT', 'Expense', id, { status: item.status }, { status: updated.status, reason });
    return { data: updated };
  });

  app.post('/api/v1/approvals/expenses/:id/mark-paid', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.expense.findUnique({ where: { id } });
    if (!item) return reply.notFound('Expense not found');
    if (item.status !== 'APPROVED') return reply.badRequest(`Cannot mark expense paid from ${item.status}`);
    const updated = await prisma.expense.update({ where: { id }, data: { status: 'PAID' } });
    await audit(request, 'MARK_PAID', 'Expense', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/outsourcing/:id/approve', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.outsourceOrder.findUnique({ where: { id } });
    if (!item) return reply.notFound('Outsource order not found');
    if (item.status !== 'REQUESTED') return reply.badRequest(`Cannot approve outsourcing from ${item.status}`);
    const updated = await prisma.outsourceOrder.update({ where: { id }, data: { status: 'APPROVED' } });
    await audit(request, 'APPROVE', 'OutsourceOrder', id, { status: item.status }, { status: updated.status });
    return { data: updated };
  });

  app.post('/api/v1/approvals/outsourcing/:id/reject', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const reason = rejectSchema.parse(request.body ?? {}).reason;
    const item = await prisma.outsourceOrder.findUnique({ where: { id } });
    if (!item) return reply.notFound('Outsource order not found');
    if (item.status !== 'REQUESTED') return reply.badRequest(`Cannot reject outsourcing from ${item.status}`);
    const updated = await prisma.outsourceOrder.update({ where: { id }, data: { status: 'REJECTED' } });
    await audit(request, 'REJECT', 'OutsourceOrder', id, { status: item.status }, { status: updated.status, reason });
    return { data: updated };
  });

  app.post('/api/v1/approvals/time/:id/approve', async (request, reply) => {
    const id = idSchema.parse((request.params as any).id);
    const item = await prisma.timeEntry.findUnique({ where: { id }, include: { employee: true, job: true, task: true } });
    if (!item) return reply.notFound('Time entry not found');
    const existing = await prisma.auditLog.findFirst({ where: { entity: 'TimeEntry', entityId: String(id), action: 'APPROVE' }, orderBy: { createdAt: 'desc' } });
    if (existing) return reply.conflict('Time entry is already approved');
    await audit(request, 'APPROVE', 'TimeEntry', id, { approved: false, hours: Number(item.hours) }, { approved: true, hours: Number(item.hours) });
    return { data: { ...item, approved: true } };
  });

  app.get('/api/v1/approvals/audit', async (request) => {
    const query = z.object({ entity: z.string().max(100).optional(), entityId: z.string().max(100).optional(), action: z.string().max(100).optional() }).parse(request.query);
    const data = await prisma.auditLog.findMany({ where: { entity: query.entity, entityId: query.entityId, action: query.action }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
    return { data: data.map(serializeAuditLog) };
  });
}
