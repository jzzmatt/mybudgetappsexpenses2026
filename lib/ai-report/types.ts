import type { ExpenseCurrency } from "@/lib/currency/types";
import type { ProjectFinancialSummary } from "@/lib/projects/types";

export type ProjectAiReportContext = {
  project: {
    id: string;
    name: string;
    budget_amount: number;
    currency: ExpenseCurrency;
    status: string;
  };
  financials: ProjectFinancialSummary;
  categories: Array<{
    category: string;
    budget: number;
    paid: number;
    remaining: number;
    percentOfBudget: number;
  }>;
  vendors: Array<{
    vendor: string;
    expenseCount: number;
    budget: number;
    paid: number;
  }>;
  largestExpenses: Array<{
    description: string;
    budget_amount: number;
    paid_amount: number;
    category: string;
    status: string;
    priority: string | null;
  }>;
  pendingOrPartialExpenses: Array<{
    description: string;
    budget_amount: number;
    paid_amount: number;
    remaining: number;
    status: string;
    priority: string | null;
  }>;
};

export type AiReportResult = {
  title: string;
  project_id?: string;
  project_name?: string;
  currency: ExpenseCurrency;
  executive_summary: string;
  spending_analysis: string;
  key_findings: string[];
  largest_items: string[];
  pending_items: string[];
  recommendations: string[];
  risk_alerts: string[];
  generated_at: string;
};

export type AiReportFilters = {
  projectId?: string;
  year?: number;
  month?: number | null;
  currency?: ExpenseCurrency;
};
