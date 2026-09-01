import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const leadSchema = z.object({
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(191).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  requirement: z.string().max(5000).optional().nullable(),
  estimatedValue: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']).optional(),
  assignedToId: z.coerce.number().int().positive().optional().nullable(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  followUpAt: z.coerce.date().optional().nullable(),
});

export async function leadsRoutes(app: FastifyInstance) {
  app.get('/api/v1/leads', async (request) => {
    const q = z.object({
      search: z.string().optional(),
      status: z.enum(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']).optional(),
      assignedToId: z.coerce.number().int().positive().optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(request.query);
    const where = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
      ...(q.search ? { OR: [
        { name: { contains: q.search } },
        { company: { contains: q.search } },
        { email: { contains: q.search } },
        { phone: { contains: q.search } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { assignedTo: true, client: true },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.lead.count({ where }),
    ]);
    return { data: items, meta: { page: q.page, pageSize: q.pageSize, total } };
  });

  app.get('/api/v1/leads/:id', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as { id: string }).id);
    const data = await prisma.lead.findUnique({ where: { id }, include: { assignedTo: true, client: true } });
    if (!data) return reply.notFound('Lead not found');
    return { data };
  });

  app.post('/api/v1/leads', async (request, reply) => {
    const input = leadSchema.parse(request.body);
    const data = await prisma.lead.create({ data: input });
    return reply.code(201).send({ data });
  });

  app.patch('/api/v1/leads/:id', async (request) => {
    const id = z.coerce.number().int().positive().parse((request.params as { id: string }).id);
    const input = leadSchema.partial().parse(request.body);
    const data = await prisma.lead.update({ where: { id }, data: input });
    return { data };
  });

  app.post('/api/v1/leads/:id/convert', async (request, reply) => {
    const id = z.coerce.number().int().positive().parse((request.params as { id: string }).id);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return reply.notFound('Lead not found');
    if (lead.status === 'LOST') return reply.badRequest('A lost lead cannot be converted.');
    const input = z.object({ clientId: z.coerce.number().int().positive().optional(), requirement: z.string().max(5000).optional() }).parse(request.body ?? {});
    let clientId = input.clientId ?? lead.clientId ?? null;
    if (!clientId && lead.company) {
      const code = `LEAD-${lead.id}`;
      const client = await prisma.client.create({ data: { code, companyName: lead.company, contactName: lead.name, phone: lead.phone, email: lead.email } });
      clientId = client.id;
    }
    if (!clientId) return reply.badRequest('A client is required to convert this lead.');
    const existing = await prisma.enquiry.findFirst({ where: { clientId, requirement: input.requirement ?? lead.requirement ?? lead.name } });
    const enquiry = existing ?? await prisma.enquiry.create({ data: {
      number: `ENQ-${new Date().getFullYear()}-${String(lead.id).padStart(4, '0')}`,
      clientId,
      source: lead.source,
      requirement: input.requirement ?? lead.requirement ?? lead.name,
      status: 'OPEN',
    } });
    const updatedLead = await prisma.lead.update({ where: { id }, data: { clientId, status: 'WON' } });
    return reply.code(existing ? 200 : 201).send({ data: { lead: updatedLead, enquiry } });
  });
}
