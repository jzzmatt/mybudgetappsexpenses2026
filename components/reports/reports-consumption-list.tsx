import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { Card } from "@/components/ui/card";
import type { CategoryChartDatum } from "@/lib/dashboard/types";

type ReportsConsumptionListProps = {
  categories: CategoryChartDatum[];
};

export function ReportsConsumptionList({ categories }: ReportsConsumptionListProps) {
  if (categories.length === 0) {
    return (
      <Card className="reports-consumption-card">
        <h2>Budget Consumption</h2>
        <p className="dashboard-chart-empty">No category data for this period.</p>
      </Card>
    );
  }

  const items = categories.map((item) => ({
    category: item.category,
    percent: item.budget > 0 ? Math.min(100, (item.paid / item.budget) * 100) : 0,
  }));

  return (
    <Card className="reports-consumption-card">
      <h2>Budget Consumption</h2>
      <ul className="reports-consumption-list">
        {items.map((item) => (
          <li className="reports-consumption-item" key={item.category}>
            <div className="reports-consumption-item-header">
              <span>{item.category}</span>
              <span className="reports-consumption-percent">{item.percent.toFixed(0)}%</span>
            </div>
            <BudgetProgressBar percent={item.percent} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
