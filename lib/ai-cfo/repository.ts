import "server-only";

import { describePaymentStatus } from "@/lib/ai-cfo/aggregate";
import type { AiCfoEvidenceExpense } from "@/lib/ai-cfo/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AiCfoDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiCfoDatabaseError";
  }
}

type Relation = { id: string; name: string } | { id: string; name: string }[] | null;

export type AiCfoExpenseRecord = {
  id: string;
  date: string;
  description: string;
  budgetAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  projectId: string | null;
  projectName: string | null;
};

export type AiCfoNamedRecord = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  budgetAmount?: number;
  currency?: string | null;
};

function asNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function oneRelation(value: Relation) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeExpense(row: Record<string, unknown>): AiCfoExpenseRecord {
  const category = oneRelation(row.category as Relation);
  const project = oneRelation(row.project as Relation);

  return {
    id: String(row.id),
    date: String(row.date),
    description: String(row.description ?? ""),
    budgetAmount: asNumber(row.budget_amount),
    paidAmount: asNumber(row.paid_amount),
    balance: asNumber(row.balance),
    currency: String(row.currency ?? ""),
    status: String(row.status ?? ""),
    categoryId: category?.id ?? (row.category_id ? String(row.category_id) : null),
    categoryName: category?.name ?? null,
    projectId: project?.id ?? (row.project_id ? String(row.project_id) : null),
    projectName: project?.name ?? null,
  };
}

const expenseSelect = `
  id,
  date,
  description,
  budget_amount,
  paid_amount,
  balance,
  currency,
  status,
  category_id,
  project_id,
  category:categories(id, name),
  project:projects(id, name)
`;

export type ExpenseReadFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  projectId?: string;
  projectIds?: string[];
  status?: string;
  statuses?: string[];
  limit?: number;
};

export async function listUserCategories(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description")
    .eq("user_id", userId)
    .order("name")
    .limit(200);

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
  })) satisfies AiCfoNamedRecord[];
}

export async function listUserProjects(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, status, budget_amount, currency")
    .eq("user_id", userId)
    .order("name")
    .limit(200);

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    budgetAmount: asNumber(row.budget_amount),
    currency: row.currency ? String(row.currency) : null,
  })) satisfies AiCfoNamedRecord[];
}

export async function listUserExpenses(userId: string, filters: ExpenseReadFilters) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("expenses").select(expenseSelect).eq("user_id", userId);

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.projectIds && filters.projectIds.length > 0) {
    query = filters.projectIds.length === 1
      ? query.eq("project_id", filters.projectIds[0])
      : query.in("project_id", filters.projectIds);
  } else if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  }

  const { data, error } = await query.order("date", { ascending: false }).limit(filters.limit ?? 50);

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return (data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>));
}

export async function getUserExpense(userId: string, expenseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("user_id", userId)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return data ? normalizeExpense(data as Record<string, unknown>) : null;
}

export function toEvidence(expense: AiCfoExpenseRecord): AiCfoEvidenceExpense {
  return {
    id: expense.id,
    date: expense.date,
    description: expense.description,
    category: expense.categoryName,
    project: expense.projectName,
    paidAmount: expense.paidAmount,
    budgetAmount: expense.budgetAmount,
    currency: expense.currency,
    status: expense.status,
    paymentStatus: describePaymentStatus(expense.status, expense.paidAmount, expense.budgetAmount),
  };
}

export function sourceFromExpenses(expenses: AiCfoExpenseRecord[], periodLabel: string | null) {
  return {
    expenseCount: expenses.length,
    categoryCount: new Set(expenses.map((expense) => expense.categoryId).filter(Boolean)).size,
    projectCount: new Set(expenses.map((expense) => expense.projectId).filter(Boolean)).size,
    periodLabel,
  };
}
