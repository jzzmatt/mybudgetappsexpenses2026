import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { DashboardKpis, DashboardKpiTrends } from "@/lib/dashboard/types";

type DashboardKpiCardsProps = {
  kpis: DashboardKpis;
  kpiTrends: DashboardKpiTrends;
  currency: ExpenseCurrency;
};

type KpiItem = {
  key: keyof DashboardKpis;
  label: string;
  format: "currency" | "count";
  trendSuffix?: string;
};

const kpiItems: KpiItem[] = [
  { key: "totalBudget", label: "Total Budget", format: "currency" },
  { key: "totalPaid", label: "Total Paid", format: "currency" },
  { key: "remainingBudget", label: "Remaining Budget", format: "currency" },
  { key: "pendingExpenses", label: "Pending Expenses", format: "count", trendSuffix: " this month" },
];

function formatTrend(value: number | null, suffix = "") {
  if (value === null) {
    return "No prior data";
  }

  if (value === 0) {
    return `0%${suffix}`;
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%${suffix}`;
}

function getTrendClass(value: number | null) {
  if (value === null || value === 0) {
    return "dashboard-kpi-trend-neutral";
  }

  return value > 0 ? "dashboard-kpi-trend-positive" : "dashboard-kpi-trend-negative";
}

export function DashboardKpiCards({ kpis, kpiTrends, currency }: DashboardKpiCardsProps) {
  return (
    <div className="dashboard-kpi-grid">
      {kpiItems.map((item) => {
        const trend = kpiTrends[item.key];

        return (
          <Card className="dashboard-kpi-card" key={item.key}>
            <p className="dashboard-kpi-label">{item.label}</p>
            <p className="dashboard-kpi-value">
              {item.format === "count"
                ? kpis[item.key].toLocaleString("en-US")
                : formatCurrency(kpis[item.key], currency)}
            </p>
            <p className={`dashboard-kpi-trend ${getTrendClass(trend)}`}>
              {formatTrend(trend, item.trendSuffix)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
