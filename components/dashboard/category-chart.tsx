"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { getChartColor } from "@/lib/dashboard/chart-colors";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { CategoryChartDatum } from "@/lib/dashboard/types";

type CategoryChartProps = {
  data: CategoryChartDatum[];
  currency: ExpenseCurrency;
};

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload?: CategoryChartDatum & { fill?: string } }>;
  currency: ExpenseCurrency;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const entry = payload[0]?.payload;
  if (!entry) {
    return null;
  }

  return (
    <div className="dashboard-chart-tooltip">
      <p className="dashboard-chart-tooltip-title">{entry.category}</p>
      <p style={{ color: entry.fill }}>Budget: {formatCurrency(entry.budget, currency)}</p>
      <p>Paid: {formatCurrency(entry.paid, currency)}</p>
    </div>
  );
}

export function CategoryChart({ data, currency }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card className="dashboard-chart-card">
        <h2>Budget allocation by category</h2>
        <p className="dashboard-chart-empty">No expense data for this period.</p>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: getChartColor(index),
  }));

  return (
    <Card className="dashboard-chart-card">
      <h2>Budget allocation by category</h2>
      <div className="dashboard-chart-container dashboard-chart-container-pie">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="budget"
              innerRadius={55}
              nameKey="category"
              outerRadius={90}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell fill={entry.fill} key={entry.category} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
