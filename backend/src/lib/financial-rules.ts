export function invoiceStatus(total: number, paid: number, current: string) {
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paid <= 0) return current === 'DRAFT' ? 'DRAFT' : 'ISSUED';
  if (paid + 0.005 >= total) return 'PAID';
  return 'PARTIALLY_PAID';
}

export function remainingBalance(total: number, amountPaid: number, paymentAmount: number): number {
  return Math.max(0, total - (amountPaid + paymentAmount));
}
