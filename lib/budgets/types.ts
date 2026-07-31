import type { ExpenseCurrency } from "@/lib/currency/types";

export type BudgetRelation = {
  id: string;
  name: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string | null;
  project_id: string | null;
  name: string;
  amount: number;
  currency: ExpenseCurrency;
  month: number | null;
  year: number;
  created_at: string;
  updated_at: string;
};

export type BudgetWithRelations = Budget & {
  category: BudgetRelation | null;
  project: BudgetRelation | null;
};

export type BudgetWithUsage = BudgetWithRelations & {
  paid_amount: number;
  remaining: number;
  progress_percent: number;
};

export type BudgetFilters = {
  search?: string;
  categoryId?: string;
  projectId?: string;
  currency?: ExpenseCurrency;
  year?: number;
  month?: number;
};
