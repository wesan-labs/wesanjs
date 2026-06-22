// Aylık P&L (pure): gelir(ay) − [ sabit giderler (her ay) + o ayın ekstraları ].
// Tüm tutarlar `rate(from, reporting)` ile tek raporlama birimine çevrilir.
export type ExpenseLite = {
  amount: number
  currency: string
  recurring: boolean
  occurred_at: string | Date
}

export type MonthlyReport = {
  month: string
  currency: string
  income: number
  fixedExpense: number
  extraExpense: number
  totalExpense: number
  net: number
}

export function computeMonthlyReport(p: {
  month: string // "YYYY-MM"
  reportingCurrency: string
  incomeByCurrency: Record<string, number>
  expenses: ExpenseLite[]
  rate: (from: string, to: string) => number
}): MonthlyReport {
  const { month, reportingCurrency: rc, incomeByCurrency, expenses, rate } = p
  const conv = (amount: number, cur: string) => amount * rate(cur, rc)
  const round = (n: number) => Number(n.toFixed(2))

  const income = Object.entries(incomeByCurrency).reduce(
    (s, [cur, amt]) => s + conv(amt, cur),
    0
  )

  const [y, m] = month.split("-").map(Number)
  const inMonth = (d: string | Date) => {
    const dt = new Date(d)
    return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === m
  }

  let fixedExpense = 0
  let extraExpense = 0
  for (const e of expenses) {
    const v = conv(Number(e.amount), e.currency)
    if (e.recurring) {
      fixedExpense += v // sabit gider her aya girer
    } else if (inMonth(e.occurred_at)) {
      extraExpense += v
    }
  }

  const incomeR = round(income)
  const totalExpense = round(fixedExpense + extraExpense)
  return {
    month,
    currency: rc,
    income: incomeR,
    fixedExpense: round(fixedExpense),
    extraExpense: round(extraExpense),
    totalExpense,
    net: round(incomeR - totalExpense),
  }
}
