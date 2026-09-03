import assert from 'node:assert/strict';
import { test } from 'node:test';

function invoiceStatus(total: number, paid: number, current: string) {
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paid <= 0) return current === 'DRAFT' ? 'DRAFT' : 'ISSUED';
  if (paid + 0.005 >= total) return 'PAID';
  return 'PARTIALLY_PAID';
}

test('invoice status rules preserve draft/cancelled and transition on collected amount', () => {
  assert.equal(invoiceStatus(1000, 0, 'DRAFT'), 'DRAFT');
  assert.equal(invoiceStatus(1000, 0, 'ISSUED'), 'ISSUED');
  assert.equal(invoiceStatus(1000, 400, 'ISSUED'), 'PARTIALLY_PAID');
  assert.equal(invoiceStatus(1000, 1000, 'PARTIALLY_PAID'), 'PAID');
  assert.equal(invoiceStatus(1000, 1200, 'PARTIALLY_PAID'), 'PAID');
  assert.equal(invoiceStatus(1000, 500, 'CANCELLED'), 'CANCELLED');
});

test('invoice status rule tolerates the decimal precision boundary', () => {
  assert.equal(invoiceStatus(1000, 999.995, 'ISSUED'), 'PAID');
  assert.equal(invoiceStatus(1000, 999.994, 'ISSUED'), 'PARTIALLY_PAID');
});
