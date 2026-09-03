import assert from 'node:assert/strict';
import { test } from 'node:test';
import { labourCost, materialCost, operationalProfit, roundMoney } from '../src/lib/costing.js';

test('costing material rules include issues and waste, reverse returns, and ignore receipts/transfers', () => {
  assert.equal(materialCost([
    { type: 'PURCHASE_RECEIPT', quantity: 10, unitCost: 25 },
    { type: 'ISSUE', quantity: 4, unitCost: 25 },
    { type: 'WASTE', quantity: 1, unitCost: 30 },
    { type: 'RETURN', quantity: 1, unitCost: 25 },
    { type: 'TRANSFER', quantity: 99, unitCost: 999 },
    { type: 'ADJUSTMENT', quantity: 2, unitCost: 10 },
  ]), 105);
});

test('costing labour rules multiply hours by employee hourly cost', () => {
  assert.equal(labourCost([
    { hours: 8, hourlyCost: 1000 },
    { hours: 2.5, hourlyCost: 800 },
  ]), 10000);
});

test('costing profit rules subtract all operational cost components from revenue', () => {
  assert.equal(operationalProfit({ revenue: 100000, labour: 12000, material: 18000, outsource: 7000, expenses: 3000 }), 60000);
});

test('money rounding is deterministic to two decimal places', () => {
  assert.equal(roundMoney(12.345), 12.35);
  assert.equal(roundMoney(12.344), 12.34);
});
