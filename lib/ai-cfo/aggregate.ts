export type AmountRow = {
  date: string;
  currency: string;
  paidAmount: number;
  budgetAmount: number;
  status: string;
};

export type MoneyTotal = {
  currency: string;
  total: number;
  expenseCount: number;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function summarizeAmounts(rows: AmountRow[], basis: "paid" | "budget"): MoneyTotal[] {
  const totals = new Map<string, MoneyTotal>();

  for (const row of rows) {
    const amount = basis === "budget" ? row.budgetAmount : row.paidAmount;
    const current = totals.get(row.currency) ?? { currency: row.currency, total: 0, expenseCount: 0 };
    current.total = roundMoney(current.total + amount);
    current.expenseCount += 1;
    totals.set(row.currency, current);
  }

  return [...totals.values()];
}

export type MonthlyTotal = MoneyTotal & {
  month: string;
};

export function summarizeByMonth(rows: AmountRow[], basis: "paid" | "budget"): MonthlyTotal[] {
  const groups = new Map<string, AmountRow[]>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), row]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([month, monthRows]) =>
      summarizeAmounts(monthRows, basis).map((total) => ({
        month,
        ...total,
      })),
    );
}

export function describePaymentStatus(status: string, paidAmount: number, budgetAmount: number) {
  if (status === "paid" || (budgetAmount > 0 && paidAmount >= budgetAmount && status !== "partial")) {
    return "paid" as const;
  }

  if (status === "partial" || paidAmount > 0) {
    return "partial" as const;
  }

  return "unpaid" as const;
}

export function isUnpaidStatus(status: string, balance: number) {
  return status === "pending" || status === "partial" || balance > 0;
}
