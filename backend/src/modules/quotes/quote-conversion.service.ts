import { prisma } from '../../lib/prisma.js';

export type ConvertQuoteInput = {
  number?: string;
  name?: string;
  ownerId?: number;
  startDate?: Date;
  dueDate?: Date;
  actorId?: number | null;
};

export class QuoteConversionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'QuoteConversionError';
    this.statusCode = statusCode;
  }
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function allocate(total: number, weights: number[], index: number) {
  if (index === weights.length - 1) {
    const assigned = weights.slice(0, -1).reduce((sum, weight) => sum + roundMoney(total * weight), 0);
    return roundMoney(total - assigned);
  }
  return roundMoney(total * weights[index]);
}

export async function convertAcceptedQuoteToProject(quoteId: number, input: ConvertQuoteInput = {}) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { client: true, enquiry: true, items: { orderBy: { id: 'asc' } }, project: true },
    });

    if (!quote) throw new QuoteConversionError('Quote not found', 404);
    if (quote.status !== 'ACCEPTED') throw new QuoteConversionError('Only accepted quotes can be converted to a project');
    if (quote.project) throw new QuoteConversionError(`Quote is already converted to project ${quote.project.number}`, 409);
    if (quote.items.length === 0) throw new QuoteConversionError('Quote must contain at least one item before conversion');

    const projectNumber = input.number?.trim() || `PRJ-${quote.id}-${quote.number}`.slice(0, 50);
    const projectName = (input.name?.trim() || `${quote.client.companyName} — ${quote.number}`).slice(0, 200);
    const startDate = input.startDate ?? new Date();
    const dueDate = input.dueDate ?? quote.enquiry?.targetDate ?? undefined;
    const total = Number(quote.total);
    const weights = quote.items.map((item) => total > 0 ? Number(item.total) / total : 1 / quote.items.length);
    const costKeys = ['expectedMaterial', 'expectedLabour', 'expectedOutsource', 'expectedExpense'] as const;
    const allocations = costKeys.map((key) => {
      const totalCost = Number(quote[key]);
      return quote.items.map((_, index) => allocate(totalCost, weights, index));
    });

    const project = await tx.project.create({
      data: {
        number: projectNumber,
        name: projectName,
        clientId: quote.clientId,
        quoteId: quote.id,
        ownerId: input.ownerId,
        startDate,
        dueDate,
        value: quote.total,
        jobs: {
          create: quote.items.map((item, index) => ({
            number: `JOB-${quote.id}-${index + 1}`.slice(0, 50),
            serviceId: item.serviceId,
            title: item.description.slice(0, 200),
            description: `Created from quote ${quote.number}`,
            startDate,
            dueDate,
            revenue: item.total,
            estimatedMaterial: allocations[0][index],
            estimatedLabour: allocations[1][index],
            estimatedOutsource: allocations[2][index],
            estimatedExpense: allocations[3][index],
            assignmentType: 'INTERNAL',
            status: 'DRAFT',
          })),
        },
      },
      include: { client: true, quote: true, owner: true, jobs: { include: { service: true } } },
    });

    if (quote.enquiryId) {
      await tx.enquiry.update({ where: { id: quote.enquiryId }, data: { status: 'CONVERTED' } });
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorId ?? null,
        action: 'CONVERT',
        entity: 'Quote',
        entityId: String(quote.id),
        beforeJson: { status: quote.status, projectId: null },
        afterJson: { status: quote.status, projectId: project.id, projectNumber: project.number, jobCount: project.jobs.length },
      },
    });

    return project;
  });
}
