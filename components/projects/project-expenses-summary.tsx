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

    const label =
      totals.currencies.length > 1 ? `Total Budget (${currency})` : "Total Budget";

    return [
      {
        key: `budget-${currency}`,
        label,
        value: formatCurrency(totalsForCurrency.totalBudget, currency),
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
    },
    ...budgetItems,
  ];

  if (budgetItems.length === 0) {
    items.push({
      key: "budget-empty",
      label: "Total Budget",
      value: formatCurrency(0),
    });
  }

  return (
    <div className="budget-summary-grid">
      {items.map((item) => (
        <Card className="budget-summary-card" key={item.key}>
          <p className="budget-summary-label">{item.label}</p>
          <p className="budget-summary-value">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
