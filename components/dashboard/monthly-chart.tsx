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
import type { MonthlyChartDatum } from "@/lib/dashboard/types";

type MonthlyChartProps = {
  data: MonthlyChartDatum[];
  year: number;
  currency: ExpenseCurrency;
};

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

export function MonthlyChart({ data, year, currency }: MonthlyChartProps) {
  const hasData = data.some((item) => item.budget > 0 || item.paid > 0);

  if (!hasData) {
    return (
      <Card className="dashboard-chart-card dashboard-chart-card-wide">
        <h2>Monthly expenses ({year})</h2>
        <p className="dashboard-chart-empty">No expense data for this year.</p>
      </Card>
    );
  }

  return (
    <Card className="dashboard-chart-card dashboard-chart-card-wide">
      <h2>Monthly expenses ({year})</h2>
      <div
        aria-label={`Bar chart of monthly expenses for ${year}`}
        className="dashboard-chart-container dashboard-chart-container-monthly"
        role="img"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value), currency)}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend />
            <Bar dataKey="budget" fill={getChartColor(0)} name="Budget" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" fill={getChartColor(1)} name="Paid" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
