import type { ExpenseCurrency } from "@/lib/currency/types";

export type AiReportFilters = {
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
};

export type AiReportResult = {
  title: string;
  period_label: string;
  currency: ExpenseCurrency;
  executive_summary: string;
  key_findings: string[];
  recommendations: string[];
  risk_alerts: string[];
  generated_at: string;
};

export type AiReportContext = {
  period_label: string;
  currency: ExpenseCurrency;
  kpis: {
    total_budget: number;
    total_paid: number;
    remaining_budget: number;
    pending_expenses: number;
  };
  category_breakdown: Array<{ category: string; budget: number; paid: number }>;
  monthly_trend: Array<{ month: string; budget: number; paid: number }>;
  budgets: Array<{
    name: string;
    category: string | null;
    project: string | null;
    amount: number;
    paid: number;
    remaining: number;
    progress_percent: number;
  }>;
};
