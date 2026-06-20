export function computeNet(revenue28d: number, expenseTotal: number): number {
  return Number((revenue28d - expenseTotal).toFixed(2))
}

export function sumAmounts(rows: { amount: number }[]): number {
  return Number(rows.reduce((acc, r) => acc + Number(r.amount), 0).toFixed(2))
}
