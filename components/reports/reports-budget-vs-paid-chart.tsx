"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { getChartColor } from "@/lib/dashboard/chart-colors";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { CategoryChartDatum } from "@/lib/dashboard/types";

type ReportsBudgetVsPaidChartProps = {
  currency: ExpenseCurrency;
  data: CategoryChartDatum[];
};

function shortenCategory(category: string) {
  const labels: Record<string, string> = {
    Infrastructure: "Infra",
    Marketing: "Mkt",
    Operations: "Ops",
    Technology: "Tech",
  };

  return labels[category] ?? category;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ color?: string; name?: string; value?: number }>;
  label?: string;
  currency: ExpenseCurrency;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="dashboard-chart-tooltip">
      <p className="dashboard-chart-tooltip-title">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value ?? 0, currency)}
        </p>
      ))}
    </div>
  );
}

export function ReportsBudgetVsPaidChart({ data, currency }: ReportsBudgetVsPaidChartProps) {
  if (data.length === 0) {
    return (
      <Card className="dashboard-chart-card reports-chart-card">
        <h2>Budget vs Paid</h2>
        <p className="dashboard-chart-empty">No expense data for this period.</p>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    shortCategory: shortenCategory(item.category),
  }));

  return (
    <Card className="dashboard-chart-card reports-chart-card">
      <h2>Budget vs Paid</h2>
      <div
        aria-label="Bar chart comparing budget and paid amounts by category"
        className="dashboard-chart-container reports-chart-container"
        role="img"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="shortCategory" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value), currency)}
            />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.category ? String(payload[0].payload.category) : ""
              }
            />
            <Legend />
            <Bar dataKey="budget" fill={getChartColor(0)} name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" fill={getChartColor(1)} name="Paid" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
