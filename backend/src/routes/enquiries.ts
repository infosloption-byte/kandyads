import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createEnquirySchema = z.object({
  number: z.string().min(2).max(50),
  clientId: z.number().int().positive(),
  source: z.string().max(100).optional(),
  requirement: z.string().min(2).max(4000),
  siteLocation: z.string().max(500).optional(),
  targetDate: z.string().datetime().optional(),
  priority: z.string().max(40).optional(),
});

export async function registerEnquiryRoutes(app: any) {
  app.get('/api/v1/enquiries', async (request: any) => {
    const query = z.object({ search: z.string().optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);
    const where = query.search ? { OR: [{ number: { contains: query.search } }, { requirement: { contains: query.search } }] } : {};
    const [items, total] = await Promise.all([
      prisma.enquiry.findMany({ where, include: { client: { select: { id: true, companyName: true, contactName: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.enquiry.count({ where }),
    ]);
    return { data: items, meta: { page: query.page, pageSize: query.pageSize, total } };
  });

  app.post('/api/v1/enquiries', async (request: any, reply: any) => {
    const input = createEnquirySchema.parse(request.body);
    const enquiry = await prisma.enquiry.create({ data: { ...input, targetDate: input.targetDate ? new Date(input.targetDate) : undefined } });
    return reply.code(201).send({ data: enquiry });
  });
}
