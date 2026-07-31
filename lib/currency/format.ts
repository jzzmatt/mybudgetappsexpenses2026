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

export function formatCompactCurrency(
  amount: number,
  currency: ExpenseCurrency = DEFAULT_EXPENSE_CURRENCY,
) {
  const abs = Math.abs(amount);

  if (currency === "KZ") {
    if (abs >= 1_000_000) {
      return `Kz ${(amount / 1_000_000).toFixed(1)}M`;
    }

    if (abs >= 1_000) {
      return `Kz ${(amount / 1_000).toFixed(1)}K`;
    }

    return formatCurrency(amount, currency);
  }

  if (abs >= 1_000_000) {
    return new Intl.NumberFormat(currency === "EUR" ? "de-DE" : "en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return formatCurrency(amount, currency);
}
