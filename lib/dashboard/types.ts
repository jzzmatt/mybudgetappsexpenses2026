import type { ExpenseCurrency } from "@/lib/currency/types";

export type DashboardKpis = {
  totalBudget: number;
  totalPaid: number;
  remainingBudget: number;
  pendingExpenses: number;
};

export type DashboardKpiTrends = {
  totalBudget: number | null;
  totalPaid: number | null;
  remainingBudget: number | null;
  pendingExpenses: number | null;
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

export type DashboardRecentExpense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
};

export type DashboardProjectBudget = {
  project: string;
  budget: number;
  paid: number;
  progress: number;
};

export type DashboardData = {
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
  periodLabel: string;
  kpis: DashboardKpis;
  kpiTrends: DashboardKpiTrends;
  categoryData: CategoryChartDatum[];
  monthlyData: MonthlyChartDatum[];
  recentExpenses: DashboardRecentExpense[];
  projectBudgets: DashboardProjectBudget[];
};

export type DashboardPeriod = {
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
};
