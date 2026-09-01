import { prisma } from '../../lib/prisma.js';

export type ConvertEnquiryInput = {
  number?: string;
  validUntil?: Date;
  expectedMaterial?: number;
  expectedLabour?: number;
  expectedOutsource?: number;
  expectedExpense?: number;
  items: Array<{
    serviceId?: number;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    discount?: number;
    tax?: number;
  }>;
  actorId?: number | null;
};

export class EnquiryQuoteConversionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'EnquiryQuoteConversionError';
    this.statusCode = statusCode;
  }
}

export async function convertEnquiryToQuote(enquiryId: number, input: ConvertEnquiryInput) {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.enquiry.findUnique({ where: { id: enquiryId }, include: { quote: true, client: true } });
    if (!enquiry) throw new EnquiryQuoteConversionError('Enquiry not found', 404);
    if (enquiry.quote) throw new EnquiryQuoteConversionError(`Enquiry is already linked to quote ${enquiry.quote.number}`, 409);
    if (!['OPEN', 'QUOTING'].includes(enquiry.status)) throw new EnquiryQuoteConversionError(`Cannot create a quote from enquiry in ${enquiry.status} status`);
    if (!input.items.length) throw new EnquiryQuoteConversionError('At least one quote item is required');

    const items = input.items.map((item) => {
      const discount = item.discount ?? 0;
      const tax = item.tax ?? 0;
      const net = item.quantity * item.rate - discount;
      return { ...item, discount, tax, total: net + tax };
    });
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate - item.discount, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const tax = items.reduce((sum, item) => sum + item.tax, 0);
    const total = subtotal + tax;
    const expectedMaterial = input.expectedMaterial ?? 0;
    const expectedLabour = input.expectedLabour ?? 0;
    const expectedOutsource = input.expectedOutsource ?? 0;
    const expectedExpense = input.expectedExpense ?? 0;

    const quote = await tx.quote.create({
      data: {
        number: input.number?.trim() || `QT-${enquiry.id}-${Date.now()}`,
        clientId: enquiry.clientId,
        enquiryId: enquiry.id,
        validUntil: input.validUntil,
        subtotal,
        discount,
        tax,
        total,
        expectedMaterial,
        expectedLabour,
        expectedOutsource,
        expectedExpense,
        expectedMargin: total - expectedMaterial - expectedLabour - expectedOutsource - expectedExpense,
        items: { create: items },
      },
      include: { client: true, enquiry: true, items: true },
    });

    await tx.enquiry.update({ where: { id: enquiry.id }, data: { status: 'QUOTING' } });
    await tx.auditLog.create({
      data: {
        userId: input.actorId ?? null,
        action: 'CONVERT_TO_QUOTE',
        entity: 'Enquiry',
        entityId: String(enquiry.id),
        beforeJson: { status: enquiry.status, quoteId: null },
        afterJson: { status: 'QUOTING', quoteId: quote.id, quoteNumber: quote.number },
      },
    });

    return quote;
  });
}
