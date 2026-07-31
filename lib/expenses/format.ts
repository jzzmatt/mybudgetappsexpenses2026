export { formatCurrency } from "@/lib/currency/format";

export function formatExpenseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
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

export function formatExpensePercentage(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  if (value < 0.1) {
    return "<0.1%";
  }

  return `${value.toFixed(1)}%`;
}
