import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { formatLabel } from "@/lib/expenses/format";
import type { Project, ProjectExpenseTotals } from "@/lib/projects/types";

type ProjectExpensesSummaryProps = {
  project: Project;
  totals: ProjectExpenseTotals;
};

export function ProjectExpensesSummary({ project, totals }: ProjectExpensesSummaryProps) {
  const budgetItems = totals.currencies.flatMap((currencyCode) => {
    if (!isExpenseCurrency(currencyCode)) {
      return [];
    }

    const currency = currencyCode as ExpenseCurrency;
    const totalsForCurrency = totals.byCurrency[currency];

    if (!totalsForCurrency) {
      return [];
    }

    const multiCurrency = totals.currencies.length > 1;

    return [
      {
        key: `budget-${currency}`,
        label: multiCurrency ? `Total Budget (${currency})` : "Total Budget",
        value: formatCurrency(totalsForCurrency.totalBudget, currency),
        variant: "default" as const,
      },
      {
        key: `paid-${currency}`,
        label: multiCurrency ? `Total Paid (${currency})` : "Total Paid",
        value: formatCurrency(totalsForCurrency.totalPaid, currency),
        variant: "paid" as const,
      },
      {
        key: `remaining-${currency}`,
        label: multiCurrency ? `Total Remaining (${currency})` : "Total Remaining",
        value: formatCurrency(totalsForCurrency.totalBalance, currency),
        variant: "remaining" as const,
      },
    ];
  });

  const items = [
    {
      key: "status",
      label: "Status",
      value: (
        <span className={`status-badge status-${project.status}`}>
          {formatLabel(project.status)}
        </span>
      ),
      variant: "default" as const,
    },
    ...budgetItems,
  ];

  if (budgetItems.length === 0) {
    items.push(
      {
        key: "budget-empty",
        label: "Total Budget",
        value: formatCurrency(0),
        variant: "default" as const,
      },
      {
        key: "paid-empty",
        label: "Total Paid",
        value: formatCurrency(0),
        variant: "paid" as const,
      },
      {
        key: "remaining-empty",
        label: "Total Remaining",
        value: formatCurrency(0),
        variant: "remaining" as const,
      },
    );
  }

  return (
    <div className="budget-summary-grid">
      {items.map((item) => (
        <Card
          className={`budget-summary-card${
            item.variant === "paid"
              ? " project-expenses-paid-card"
              : item.variant === "remaining"
                ? " project-expenses-remaining-card"
                : ""
          }`}
          key={item.key}
        >
          <p className="budget-summary-label">{item.label}</p>
          <p className="budget-summary-value">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
