import { Card } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { DashboardKpis } from "@/lib/dashboard/types";

type ReportsSummaryCardsProps = {
  currency: ExpenseCurrency;
  kpis: DashboardKpis;
};

export function ReportsSummaryCards({ currency, kpis }: ReportsSummaryCardsProps) {
  const totalBudget = kpis.totalBudget;
  const totalPaid = kpis.totalPaid;
  const remaining = kpis.remainingBudget;
  const utilization = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

  const items = [
    {
      label: "Total Budget",
      compact: formatCompactCurrency(totalBudget, currency),
      full: formatCurrency(totalBudget, currency),
    },
    {
      label: "Total Paid",
      compact: formatCompactCurrency(totalPaid, currency),
      full: formatCurrency(totalPaid, currency),
    },
    {
      label: "Remaining",
      compact: formatCompactCurrency(remaining, currency),
      full: formatCurrency(remaining, currency),
    },
    {
      label: "Utilization",
      compact: `${utilization.toFixed(1)}%`,
      full: `${utilization.toFixed(1)}%`,
    },
  ];

  return (
    <div className="reports-summary-grid">
      {items.map((item) => (
        <Card className="reports-summary-card" key={item.label}>
          <p className="reports-summary-label">{item.label}</p>
          <p className="reports-summary-value reports-summary-value-compact">{item.compact}</p>
          <p className="reports-summary-value reports-summary-value-full">{item.full}</p>
        </Card>
      ))}
    </div>
  );
}
