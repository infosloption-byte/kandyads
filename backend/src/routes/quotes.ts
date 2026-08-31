import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createQuoteSchema = z.object({
  number: z.string().min(2).max(50),
  clientId: z.number().int().positive(),
  enquiryId: z.number().int().positive().optional(),
  validUntil: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string().min(2).max(1000),
    serviceId: z.number().int().positive().optional(),
    quantity: z.number().positive(),
    unit: z.string().min(1).max(40),
    rate: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
    tax: z.number().nonnegative().default(0),
  })).min(1),
  expectedMaterial: z.number().nonnegative().default(0),
  expectedLabour: z.number().nonnegative().default(0),
  expectedOutsource: z.number().nonnegative().default(0),
  expectedExpense: z.number().nonnegative().default(0),
});

export async function registerQuoteRoutes(app: any) {
  app.get('/api/v1/quotes', async (request: any) => {
    const query = z.object({ search: z.string().optional(), page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);
    const where = query.search ? { OR: [{ number: { contains: query.search } }, { client: { companyName: { contains: query.search } } }] } : {};
    const [items, total] = await Promise.all([
      prisma.quote.findMany({ where, include: { client: { select: { id: true, companyName: true } }, enquiry: { select: { id: true, number: true } }, items: true }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.quote.count({ where }),
    ]);
    return { data: items, meta: { page: query.page, pageSize: query.pageSize, total } };
  });

  app.post('/api/v1/quotes', async (request: any, reply: any) => {
    const input = createQuoteSchema.parse(request.body);
    const computedItems = input.items.map((item) => {
      const subtotal = item.quantity * item.rate;
      const total = Math.max(0, subtotal - item.discount) + item.tax;
      return { ...item, total };
    });
    const subtotal = computedItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const discount = computedItems.reduce((sum, item) => sum + item.discount, 0);
    const tax = computedItems.reduce((sum, item) => sum + item.tax, 0);
    const total = Math.max(0, subtotal - discount) + tax;
    const expectedCost = input.expectedMaterial + input.expectedLabour + input.expectedOutsource + input.expectedExpense;
    const expectedMargin = total - expectedCost;

    const quote = await prisma.quote.create({
      data: {
        number: input.number,
        clientId: input.clientId,
        enquiryId: input.enquiryId,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        subtotal,
        discount,
        tax,
        total,
        expectedMaterial: input.expectedMaterial,
        expectedLabour: input.expectedLabour,
        expectedOutsource: input.expectedOutsource,
        expectedExpense: input.expectedExpense,
        expectedMargin,
        items: { create: computedItems.map(({ description, serviceId, quantity, unit, rate, discount, tax, total: itemTotal }) => ({ description, serviceId, quantity, unit, rate, discount, tax, total: itemTotal })) },
      },
      include: { items: true },
    });
    return reply.code(201).send({ data: quote });
  });
}
