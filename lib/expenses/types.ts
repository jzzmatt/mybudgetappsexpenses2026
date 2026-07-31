import type { ExpenseCurrency } from "@/lib/currency/types";

export type ExpenseBudgetTotals = Partial<Record<ExpenseCurrency, number>>;

export const EXPENSE_STATUSES = ["pending", "partial", "paid"] as const;
export const EXPENSE_PRIORITIES = ["low", "medium", "high"] as const;
export const EXPENSE_PAYMENT_METHODS = ["card", "bank_transfer", "cash", "check", "other"] as const;
export const EXPENSE_SORT_FIELDS = [
  "date",
  "description",
  "budget_amount",
  "paid_amount",
  "balance",
  "percentage",
  "status",
] as const;

export const EXPENSE_PAGE_SIZE = 10;

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type ExpensePriority = (typeof EXPENSE_PRIORITIES)[number];
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];
export type ExpenseSortField = (typeof EXPENSE_SORT_FIELDS)[number];

export type ExpenseRelation = {
  id: string;
  name: string;
};

export type Expense = {
  id: string;
  user_id: string;
  date: string;
  month: number;
  year: number;
  category_id: string | null;
  project_id: string | null;
  vendor_id: string | null;
  description: string;
  currency: ExpenseCurrency;
  budget_amount: number;
  paid_amount: number;
  balance: number;
  payment_method: string | null;
  priority: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseWithRelations = Expense & {
  category: ExpenseRelation | null;
  project: ExpenseRelation | null;
  vendor: ExpenseRelation | null;
};

export type ExpenseFilters = {
  search?: string;
  categoryId?: string;
  projectId?: string;
  vendorId?: string;
  status?: ExpenseStatus;
  currency?: ExpenseCurrency;
  year?: number;
  month?: number;
  sort?: ExpenseSortField;
  order?: "asc" | "desc";
  page?: number;
};

export type ExpenseListResult = {
  expenses: ExpenseWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalBudgetByCurrency: ExpenseBudgetTotals;
};
