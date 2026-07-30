import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses/format";
import type { DashboardKpis } from "@/lib/dashboard/types";

type DashboardKpiCardsProps = {
  kpis: DashboardKpis;
};

const kpiItems = [
  { key: "totalBudget", label: "Total budget", valueKey: "totalBudget" as const },
  { key: "totalPaid", label: "Total paid", valueKey: "totalPaid" as const },
  { key: "remainingBudget", label: "Remaining budget", valueKey: "remainingBudget" as const },
  { key: "pendingExpenses", label: "Pending expenses", valueKey: "pendingExpenses" as const },
];

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  return (
    <div className="dashboard-kpi-grid">
      {kpiItems.map((item) => (
        <Card className="dashboard-kpi-card" key={item.key}>
          <p className="dashboard-kpi-label">{item.label}</p>
          <p className="dashboard-kpi-value">
            {item.valueKey === "pendingExpenses"
              ? kpis.pendingExpenses.toLocaleString("en-US")
              : formatCurrency(kpis[item.valueKey])}
          </p>
        </Card>
      ))}
    </div>
  );
}
