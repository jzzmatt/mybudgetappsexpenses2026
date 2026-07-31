"use client";

import dynamic from "next/dynamic";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { MonthlyChartDatum } from "@/lib/dashboard/types";

const ChartSkeleton = () => <div aria-hidden="true" className="dashboard-chart-skeleton" />;

const MonthlyChart = dynamic(
  () => import("@/components/dashboard/monthly-chart").then((module) => module.MonthlyChart),
  { loading: () => <ChartSkeleton />, ssr: false },
);

type ReportsMonthlyChartProps = {
  currency: ExpenseCurrency;
  data: MonthlyChartDatum[];
  year: number;
};

export function ReportsMonthlyChart({ currency, data, year }: ReportsMonthlyChartProps) {
  return <MonthlyChart currency={currency} data={data} year={year} />;
}
