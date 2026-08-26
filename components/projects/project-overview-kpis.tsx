import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ProjectFinancialSummary } from "@/lib/projects/types";

type ProjectOverviewKpisProps = {
  financials: ProjectFinancialSummary;
};

export function ProjectOverviewKpis({ financials }: ProjectOverviewKpisProps) {
  const {
    projectBudget,
    totalExpenseBudget,
    totalPaid,
    totalExpenseRemaining,
    availableBudget,
    projectPaidPercent,
    allocatedPercent,
    isOverspent,
    expenseCount,
    currency,
  } = financials;

  const items = [
    {
      label: "Project Budget",
      value: formatCurrency(projectBudget, currency),
      subtext: `${allocatedPercent.toFixed(1)}% allocated`,
      variant: "default",
    },
    {
      label: "Total Expense Budget",
      value: formatCurrency(totalExpenseBudget, currency),
      subtext: isOverspent ? "Exceeds Project Budget" : "Sum of expense budgets",
      variant: isOverspent ? "danger" : "default",
    },
    {
      label: "Total Paid",
      value: formatCurrency(totalPaid, currency),
      subtext: `${projectPaidPercent.toFixed(1)}% of project budget`,
      variant: "paid",
    },
    {
      label: "Total Remaining",
      value: formatCurrency(totalExpenseRemaining, currency),
      subtext: "Unpaid balance",
      variant: "remaining",
    },
    {
      label: "Available Budget",
      value: formatCurrency(availableBudget, currency),
      subtext: availableBudget < 0 ? "Budget Deficit" : "Remaining unallocated",
      variant: availableBudget < 0 ? "danger" : "default",
    },
    {
      label: "Number of Expenses",
      value: expenseCount.toLocaleString("en-US"),
      subtext: "Recorded in workspace",
      variant: "default",
    },
  ];

  return (
    <div className="project-kpi-grid">
      {items.map((item) => (
        <Card
          className={`project-kpi-card ${
            item.variant === "paid"
              ? "project-expenses-paid-card"
              : item.variant === "remaining"
                ? "project-expenses-remaining-card"
                : item.variant === "danger"
                  ? "project-kpi-card-danger"
                  : ""
          }`}
          key={item.label}
        >
          <p className="project-kpi-label">{item.label}</p>
          <p className="project-kpi-value">{item.value}</p>
          <p className="project-kpi-subtext">{item.subtext}</p>
        </Card>
      ))}
    </div>
  );
}
