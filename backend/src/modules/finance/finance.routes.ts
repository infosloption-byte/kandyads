import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { actorId, writeAudit } from '../audit/audit.service.js';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1).max(30),
  rate: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative(),
});

const invoiceSchema = z.object({
  number: z.string().min(2).max(50),
  clientId: z.coerce.number().int().positive(),
  projectId: z.coerce.number().int().positive().optional().nullable(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  subtotal: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  status: z.enum(['DRAFT','ISSUED','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED']).default('DRAFT'),
  items: z.array(invoiceItemSchema).min(1),
});

const paymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  paidAt: z.coerce.date(),
  method: z.string().min(1).max(50),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

function invoiceStatus(total: number, paid: number, current: string) {
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paid <= 0) return current === 'DRAFT' ? 'DRAFT' : 'ISSUED';
  if (paid + 0.005 >= total) return 'PAID';
  return 'PARTIALLY_PAID';
}

export async function financeRoutes(app: FastifyInstance) {
  app.get('/api/v1/invoices', async (request) => {
    const query = z.object({ q: z.string().optional(), status: z.string().optional(), clientId: z.coerce.number().int().positive().optional(), projectId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.invoice.findMany({
      where: {
        status: query.status as any,
        clientId: query.clientId,
        projectId: query.projectId,
        ...(query.q ? { OR: [{ number: { contains: query.q } }, { client: { companyName: { contains: query.q } } }] } : {}),
      },
      include: { client: true, project: true, items: true, payments: true },
      orderBy: { invoiceDate: 'desc' },
    });
    return { data };
  });

  app.post('/api/v1/invoices', async (request, reply) => {
    const input = invoiceSchema.parse(request.body);
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) return reply.badRequest('Client not found');
    if (input.projectId) {
      const project = await prisma.project.findUnique({ where: { id: input.projectId } });
      if (!project || project.clientId !== input.clientId) return reply.badRequest('Project does not belong to selected client');
    }
    const userId = actorId(request);
    const data = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          number: input.number,
          clientId: input.clientId,
          projectId: input.projectId ?? null,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          subtotal: input.subtotal,
          discount: input.discount,
          tax: input.tax,
          total: input.total,
          amountPaid: 0,
          balance: input.total,
          status: input.status,
          items: { create: input.items },
        },
        include: { client: true, project: true, items: true, payments: true },
      });
      await writeAudit(tx, {
        userId,
        action: 'INVOICE_CREATED',
        entity: 'Invoice',
        entityId: invoice.id,
        beforeJson: null,
        afterJson: { id: invoice.id, number: invoice.number, total: invoice.total, balance: invoice.balance, status: invoice.status },
      });
      return invoice;
    });
    return reply.code(201).send({ data });
  });

  app.get('/api/v1/invoices/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as any).id);
    const data = await prisma.invoice.findUnique({ where: { id }, include: { client: true, project: true, items: true, payments: true } });
    if (!data) return reply.notFound('Invoice not found');
    return { data };
  });

  app.post('/api/v1/payments', async (request, reply) => {
    const input = paymentSchema.parse(request.body);
    const userId = actorId(request);
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
      if (!invoice) throw app.httpErrors.notFound('Invoice not found');
      if (invoice.status === 'CANCELLED') throw app.httpErrors.badRequest('Cannot pay a cancelled invoice');
      const balance = Number(invoice.balance);
      if (input.amount > balance + 0.005) throw app.httpErrors.badRequest(`Payment exceeds outstanding balance of ${balance.toFixed(2)}`);
      const payment = await tx.payment.create({ data: input });
      const newPaid = Number(invoice.amountPaid) + input.amount;
      const newBalance = Math.max(0, Number(invoice.total) - newPaid);
      const newStatus = invoiceStatus(Number(invoice.total), newPaid, invoice.status);
      const updated = await tx.invoice.update({ where: { id: invoice.id }, data: { amountPaid: newPaid, balance: newBalance, status: newStatus } });
      await writeAudit(tx, {
        userId,
        action: 'PAYMENT_POSTED',
        entity: 'Invoice',
        entityId: invoice.id,
        beforeJson: { amountPaid: invoice.amountPaid, balance: invoice.balance, status: invoice.status },
        afterJson: { paymentId: payment.id, paymentAmount: payment.amount, amountPaid: updated.amountPaid, balance: updated.balance, status: updated.status },
      });
      return { payment, invoice: updated };
    });
    return reply.code(201).send({ data: result });
  });

  app.get('/api/v1/payments', async (request) => {
    const query = z.object({ invoiceId: z.coerce.number().int().positive().optional() }).parse(request.query);
    const data = await prisma.payment.findMany({ where: { invoiceId: query.invoiceId }, include: { invoice: true }, orderBy: { paidAt: 'desc' } });
    return { data };
  });
}
