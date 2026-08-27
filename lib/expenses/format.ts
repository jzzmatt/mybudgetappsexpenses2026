export { formatCurrency } from "@/lib/currency/format";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import type { Locale } from "@/lib/i18n/types";

export function formatExpenseDate(date: string, locale?: Locale | string) {
  const intlLocale =
    typeof locale === "string" && locale.includes("-")
      ? locale
      : getIntlLocale((locale as Locale) ?? "pt");
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function calculateExpenseBudgetPercentage(
  budgetAmount: number,
  currency: string,
  totalBudgetByCurrency: Record<string, number | undefined>,
) {
  const totalBudget = totalBudgetByCurrency[currency] ?? 0;

  if (totalBudget <= 0) {
    return 0;
  }

  return (budgetAmount / totalBudget) * 100;
}

export function calculateExpensePaidPercent(budgetAmount: number, paidAmount: number) {
  const budget = Number(budgetAmount) || 0;
  const paid = Number(paidAmount) || 0;

  if (budget <= 0) {
    return 0;
  }

  const percent = (paid / budget) * 100;
  return Number.isFinite(percent) ? percent : 0;
}

export function formatExpensePercentage(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  if (value < 0.1) {
    return "<0.1%";
  }

  return `${value.toFixed(1)}%`;
}
