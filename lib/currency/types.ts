export const EXPENSE_CURRENCIES = ["KZ", "USD", "EUR", "AOA"] as const;

export type ExpenseCurrency = (typeof EXPENSE_CURRENCIES)[number];

export const DEFAULT_EXPENSE_CURRENCY: ExpenseCurrency = "KZ";

export const CURRENCY_LABELS: Record<ExpenseCurrency, string> = {
  KZ: "KZ (Kz)",
  AOA: "AOA (Kz)",
  USD: "USD ($)",
  EUR: "EUR (€)",
};

export function isExpenseCurrency(value: string | undefined): value is ExpenseCurrency {
  return Boolean(value && EXPENSE_CURRENCIES.includes(value as ExpenseCurrency));
}
