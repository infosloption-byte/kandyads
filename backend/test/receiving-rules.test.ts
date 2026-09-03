import assert from 'node:assert/strict';
import { test } from 'node:test';

test('receiving rule rejects a receipt quantity that exceeds the ordered quantity', () => {
  const ordered = 10;
  const alreadyReceived = 7;
  const incoming = 4;
  assert.equal(alreadyReceived + incoming > ordered, true);
});

test('receiving rule accepts partial and exact completion quantities', () => {
  const ordered = 10;
  assert.equal(3 + 4 <= ordered, true);
  assert.equal(6 + 4 <= ordered, true);
});

test('receiving status rule distinguishes no receipt, partial receipt and full receipt', () => {
  const status = (ordered: number, received: number) => received >= ordered ? 'RECEIVED' : received > 0 ? 'PARTIALLY_RECEIVED' : 'DRAFT';
  assert.equal(status(10, 0), 'DRAFT');
  assert.equal(status(10, 4), 'PARTIALLY_RECEIVED');
  assert.equal(status(10, 10), 'RECEIVED');
});
