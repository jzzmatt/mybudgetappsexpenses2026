import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ReportData } from "@/lib/reports/types";

type ReportSummaryCardsProps = {
  report: ReportData;
};

const summaryItems = [
  { key: "total_budget", label: "Total budget" },
  { key: "total_paid", label: "Total paid" },
  { key: "remaining", label: "Remaining" },
  { key: "utilization_percent", label: "Utilization" },
] as const;

export function ReportSummaryCards({ report }: ReportSummaryCardsProps) {
  return (
    <div className="dashboard-kpi-grid">
      {summaryItems.map((item) => (
        <Card className="dashboard-kpi-card" key={item.key}>
          <p className="dashboard-kpi-label">{item.label}</p>
          <p className="dashboard-kpi-value">
            {item.key === "utilization_percent"
              ? `${report.summary.utilization_percent.toFixed(1)}%`
              : formatCurrency(report.summary[item.key], report.currency)}
          </p>
        </Card>
      ))}
    </div>
  );
}
