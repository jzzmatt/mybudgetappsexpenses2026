import { DEFAULT_EXPENSE_CURRENCY, type ExpenseCurrency } from "@/lib/currency/types";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import type { Locale } from "@/lib/i18n/types";

export function formatCurrency(
  amount: number,
  currency: ExpenseCurrency = DEFAULT_EXPENSE_CURRENCY,
  displayLocale?: string | Locale,
) {
  const numberLocale =
    typeof displayLocale === "string" && displayLocale.includes("-")
      ? displayLocale
      : getIntlLocale((displayLocale as Locale) ?? "pt");

  if (currency === "KZ" || currency === "AOA") {
    return `Kz ${amount.toLocaleString(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const currencyLocale = currency === "EUR" ? "de-DE" : numberLocale;

  return new Intl.NumberFormat(currencyLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currency: ExpenseCurrency = DEFAULT_EXPENSE_CURRENCY,
  displayLocale?: string | Locale,
) {
  const abs = Math.abs(amount);
  const numberLocale =
    typeof displayLocale === "string" && displayLocale.includes("-")
      ? displayLocale
      : getIntlLocale((displayLocale as Locale) ?? "pt");

  if (currency === "KZ" || currency === "AOA") {
    if (abs >= 1_000_000) {
      return `Kz ${(amount / 1_000_000).toFixed(1)}M`;
    }

    if (abs >= 1_000) {
      return `Kz ${(amount / 1_000).toFixed(1)}K`;
    }

    return formatCurrency(amount, currency, numberLocale);
  }

  const currencyLocale = currency === "EUR" ? "de-DE" : numberLocale;

  if (abs >= 1_000_000) {
    return new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return formatCurrency(amount, currency, numberLocale);
}
