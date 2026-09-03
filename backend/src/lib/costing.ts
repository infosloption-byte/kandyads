export type CostComponent = {
  quantity: number;
  unitCost: number;
};

export type CostLedgerRow = CostComponent & {
  type: 'PURCHASE_RECEIPT' | 'ISSUE' | 'RETURN' | 'TRANSFER' | 'ADJUSTMENT' | 'WASTE';
};

/**
 * Calculates the operational material cost represented by stock movements.
 * Receipts/adjustments are not consumed cost; issues and waste are positive
 * cost, returns reverse previously consumed cost, and transfers are neutral.
 */
export function materialCost(movements: CostLedgerRow[]): number {
  return movements.reduce((sum, movement) => {
    const cost = movement.quantity * movement.unitCost;
    if (movement.type === 'RETURN') return sum - cost;
    if (movement.type === 'ISSUE' || movement.type === 'WASTE') return sum + cost;
    return sum;
  }, 0);
}

export function labourCost(entries: Array<{ hours: number; hourlyCost: number }>): number {
  return entries.reduce((sum, entry) => sum + entry.hours * entry.hourlyCost, 0);
}

export function operationalProfit(input: {
  revenue: number;
  labour: number;
  material: number;
  outsource: number;
  expenses: number;
}): number {
  return input.revenue - input.labour - input.material - input.outsource - input.expenses;
}

export function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
