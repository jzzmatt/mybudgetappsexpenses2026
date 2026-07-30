import { DEFAULT_EXPENSE_CURRENCY, type ExpenseCurrency } from "@/lib/currency/types";

export function formatCurrency(
  amount: number,
  currency: ExpenseCurrency = DEFAULT_EXPENSE_CURRENCY,
) {
  if (currency === "KZ") {
    return `Kz ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const locale = currency === "EUR" ? "de-DE" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
