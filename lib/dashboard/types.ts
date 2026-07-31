import type { ExpenseCurrency } from "@/lib/currency/types";

export type DashboardKpis = {
  totalBudget: number;
  totalPaid: number;
  remainingBudget: number;
  pendingExpenses: number;
};

export type CategoryChartDatum = {
  category: string;
  budget: number;
  paid: number;
};

export type MonthlyChartDatum = {
  month: string;
  monthNumber: number;
  budget: number;
  paid: number;
};

export type DashboardData = {
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
  periodLabel: string;
  kpis: DashboardKpis;
  categoryData: CategoryChartDatum[];
  monthlyData: MonthlyChartDatum[];
};

export type DashboardPeriod = {
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
};
