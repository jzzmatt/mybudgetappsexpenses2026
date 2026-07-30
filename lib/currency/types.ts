export const EXPENSE_CURRENCIES = ["USD", "EUR", "KZ"] as const;

export type ExpenseCurrency = (typeof EXPENSE_CURRENCIES)[number];

export const DEFAULT_EXPENSE_CURRENCY: ExpenseCurrency = "USD";

export const CURRENCY_LABELS: Record<ExpenseCurrency, string> = {
  USD: "USD ($)",
  EUR: "EUR (€)",
  KZ: "KZ (Kz)",
};

export function isExpenseCurrency(value: string | undefined): value is ExpenseCurrency {
  return Boolean(value && EXPENSE_CURRENCIES.includes(value as ExpenseCurrency));
}
