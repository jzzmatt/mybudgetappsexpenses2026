import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { DEFAULT_EXPENSE_CURRENCY, type ExpenseCurrency } from "@/lib/currency/types";
import type { BudgetWithUsage } from "@/lib/budgets/types";

type BudgetSummaryCardsProps = {
  budgets: BudgetWithUsage[];
  currency?: ExpenseCurrency;
};

function resolveCurrency(budgets: BudgetWithUsage[], currency?: ExpenseCurrency): ExpenseCurrency {
  if (currency) {
    return currency;
  }

  const currencies = new Set(budgets.map((budget) => budget.currency));
  if (currencies.size === 1) {
    return budgets[0]?.currency ?? DEFAULT_EXPENSE_CURRENCY;
  }

  return DEFAULT_EXPENSE_CURRENCY;
}

export function BudgetSummaryCards({ budgets, currency }: BudgetSummaryCardsProps) {
  const displayCurrency = resolveCurrency(budgets, currency);
  const scopedBudgets = currency
    ? budgets.filter((budget) => budget.currency === currency)
    : budgets.filter((budget) => budget.currency === displayCurrency);

  const totalBudget = scopedBudgets.reduce((total, budget) => total + Number(budget.amount), 0);
  const totalPaid = scopedBudgets.reduce((total, budget) => total + budget.paid_amount, 0);
  const remaining = scopedBudgets.reduce((total, budget) => total + budget.remaining, 0);
  const utilization = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  const items = [
    { label: "Total Budget", value: formatCurrency(totalBudget, displayCurrency) },
    { label: "Total Paid", value: formatCurrency(totalPaid, displayCurrency) },
    { label: "Remaining", value: formatCurrency(remaining, displayCurrency) },
    { label: "Utilization", value: `${utilization.toFixed(1)}%` },
  ];

  return (
    <div className="budget-summary-grid">
      {items.map((item) => (
        <Card className="budget-summary-card" key={item.label}>
          <p className="budget-summary-label">{item.label}</p>
          <p className="budget-summary-value">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
