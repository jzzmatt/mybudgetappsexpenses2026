"use client";

import dynamic from "next/dynamic";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { CategoryChartDatum, MonthlyChartDatum } from "@/lib/dashboard/types";

const ChartSkeleton = () => <div aria-hidden="true" className="dashboard-chart-skeleton" />;

const BudgetVsPaidChart = dynamic(
  () => import("@/components/dashboard/budget-vs-paid-chart").then((module) => module.BudgetVsPaidChart),
  { loading: () => <ChartSkeleton />, ssr: false },
);

const CategoryChart = dynamic(
  () => import("@/components/dashboard/category-chart").then((module) => module.CategoryChart),
  { loading: () => <ChartSkeleton />, ssr: false },
);

const MonthlyChart = dynamic(
  () => import("@/components/dashboard/monthly-chart").then((module) => module.MonthlyChart),
  { loading: () => <ChartSkeleton />, ssr: false },
);

type DashboardChartsSectionProps = {
  currency: ExpenseCurrency;
  categoryData: CategoryChartDatum[];
  monthlyData: MonthlyChartDatum[];
  year: number;
};

export function DashboardChartsSection({
  currency,
  categoryData,
  monthlyData,
  year,
}: DashboardChartsSectionProps) {
  return (
    <>
      <div className="dashboard-charts-row">
        <BudgetVsPaidChart currency={currency} data={categoryData} />
        <CategoryChart currency={currency} data={categoryData} />
      </div>
      <MonthlyChart currency={currency} data={monthlyData} year={year} />
    </>
  );
}
