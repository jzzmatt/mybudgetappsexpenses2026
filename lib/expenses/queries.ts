import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import {
  EXPENSE_PAGE_SIZE,
  EXPENSE_SORT_FIELDS,
  type Expense,
  type ExpenseFilters,
  type ExpenseListResult,
  type ExpenseRelation,
  type ExpenseSortField,
  type ExpenseWithRelations,
} from "@/lib/expenses/types";

const expenseSelect = `
  id,
  user_id,
  date,
  month,
  year,
  category_id,
  project_id,
  vendor_id,
  description,
  budget_amount,
  paid_amount,
  balance,
  payment_method,
  priority,
  status,
  notes,
  created_at,
  updated_at,
  category:categories(id, name),
  project:projects(id, name),
  vendor:vendors(id, name)
`;

function normalizeRelation(
  value: ExpenseRelation | ExpenseRelation[] | null | undefined,
): ExpenseRelation | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeExpense(row: Record<string, unknown>): ExpenseWithRelations {
  const { category, project, vendor, ...expense } = row;

  return {
    ...(expense as Expense),
    category: normalizeRelation(category as ExpenseRelation | ExpenseRelation[] | null),
    project: normalizeRelation(project as ExpenseRelation | ExpenseRelation[] | null),
    vendor: normalizeRelation(vendor as ExpenseRelation | ExpenseRelation[] | null),
  };
}

function resolveSortField(sort?: ExpenseSortField): ExpenseSortField {
  if (sort && EXPENSE_SORT_FIELDS.includes(sort)) {
    return sort;
  }

  return "date";
}

export async function getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResult> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = EXPENSE_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortField = resolveSortField(filters.sort);
  const ascending = filters.order === "asc";

  let query = supabase.from("expenses").select(expenseSelect, { count: "exact" });

  const trimmedSearch = filters.search?.trim();

  if (trimmedSearch) {
    query = query.or(`description.ilike.%${trimmedSearch}%,notes.ilike.%${trimmedSearch}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.vendorId) {
    query = query.eq("vendor_id", filters.vendorId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.year) {
    query = query.eq("year", filters.year);
  }

  if (filters.month) {
    query = query.eq("month", filters.month);
  }

  query = query.order(sortField, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    expenses: (data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>)),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeExpense(data as Record<string, unknown>) : null;
}
