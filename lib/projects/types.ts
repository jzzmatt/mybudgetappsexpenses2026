import type { ExpenseCurrency } from "@/lib/currency/types";
import type { CategoryChartDatum, MonthlyChartDatum } from "@/lib/dashboard/types";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

export const PROJECT_STATUSES = ["active", "paused", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  budget_amount: number;
  currency: ExpenseCurrency;
  status: ProjectStatus | string;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  name: string;
  description?: string | null;
  budget_amount: number;
  currency: ExpenseCurrency;
  status?: ProjectStatus | string;
};

export type ProjectFinancialSummary = {
  projectBudget: number;
  totalExpenseBudget: number;
  totalPaid: number;
  totalExpenseRemaining: number;
  availableBudget: number;
  projectPaidPercent: number;
  allocatedPercent: number;
  isOverspent: boolean;
  expenseCount: number;
  currency: ExpenseCurrency;
};

export type ProjectOverviewData = {
  project: Project;
  financials: ProjectFinancialSummary;
  categoryData: CategoryChartDatum[];
  monthlyData: MonthlyChartDatum[];
  recentExpenses: ExpenseWithRelations[];
};

export type ProjectExpenseCurrencyTotals = {
  totalBudget: number;
  totalPaid: number;
  totalBalance: number;
};

export type ProjectExpenseTotals = {
  byCurrency: Partial<Record<string, ProjectExpenseCurrencyTotals>>;
  currencies: string[];
};
