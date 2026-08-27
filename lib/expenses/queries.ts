import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { getPaymentProofSignedUrl } from "@/lib/storage/payment-proofs";
import {
  EXPENSE_PAGE_SIZE,
  EXPENSE_SORT_FIELDS,
  type Expense,
  type ExpenseBudgetTotals,
  type ExpenseFilters,
  type ExpenseListResult,
  type ExpenseRelation,
  type ExpenseSortField,
  type ExpenseWithRelations,
} from "@/lib/expenses/types";
import { calculateExpenseBudgetPercentage } from "@/lib/expenses/format";

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
  currency,
  payment_method,
  payment_reference,
  payment_proof_path,
  payment_proof_filename,
  priority,
  status,
  notes,
  created_at,
  updated_at,
  category:categories(id, name),
  project:projects(id, name),
  vendor:vendors(id, name)
`;

type ExpenseSortRow = {
  id: string;
  budget_amount: number;
  currency: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterableQuery = any;

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

function applyExpenseFilters(query: FilterableQuery, filters: ExpenseFilters) {
  const trimmedSearch = filters.search?.trim();
  let nextQuery = query;

  if (trimmedSearch) {
    nextQuery = nextQuery.or(
      `description.ilike.%${trimmedSearch}%,notes.ilike.%${trimmedSearch}%`,
    );
  }

  if (filters.categoryId) {
    nextQuery = nextQuery.eq("category_id", filters.categoryId);
  }

  if (filters.projectId) {
    nextQuery = nextQuery.eq("project_id", filters.projectId);
  }

  if (filters.vendorId) {
    nextQuery = nextQuery.eq("vendor_id", filters.vendorId);
  }

  if (filters.status) {
    nextQuery = nextQuery.eq("status", filters.status);
  }

  if (filters.currency) {
    nextQuery = nextQuery.eq("currency", filters.currency);
  }

  if (filters.year) {
    nextQuery = nextQuery.eq("year", filters.year);
  }

  if (filters.month) {
    nextQuery = nextQuery.eq("month", filters.month);
  }

  return nextQuery;
}

function aggregateBudgetTotals(
  rows: Array<{ budget_amount: number; currency: string }>,
): ExpenseBudgetTotals {
  const totals: ExpenseBudgetTotals = {};

  for (const row of rows) {
    if (!isExpenseCurrency(row.currency)) {
      continue;
    }

    const currency = row.currency as ExpenseCurrency;
    totals[currency] = (totals[currency] ?? 0) + Number(row.budget_amount);
  }

  return totals;
}

function sortByPercentage(
  rows: ExpenseSortRow[],
  totalBudgetByCurrency: ExpenseBudgetTotals,
  ascending: boolean,
) {
  return [...rows].sort((left, right) => {
    const leftPercentage = calculateExpenseBudgetPercentage(
      Number(left.budget_amount),
      left.currency,
      totalBudgetByCurrency,
    );
    const rightPercentage = calculateExpenseBudgetPercentage(
      Number(right.budget_amount),
      right.currency,
      totalBudgetByCurrency,
    );

    if (leftPercentage === rightPercentage) {
      return left.id.localeCompare(right.id);
    }

    return ascending ? leftPercentage - rightPercentage : rightPercentage - leftPercentage;
  });
}

function orderExpensesByIds(expenses: ExpenseWithRelations[], ids: string[]) {
  const expenseById = new Map(expenses.map((expense) => [expense.id, expense]));

  return ids
    .map((id) => expenseById.get(id))
    .filter((expense): expense is ExpenseWithRelations => Boolean(expense));
}

async function getTotalBudgetByCurrency(filters: ExpenseFilters): Promise<ExpenseBudgetTotals> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("expenses").select("budget_amount, currency");
  query = applyExpenseFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return aggregateBudgetTotals(data ?? []);
}

export async function getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResult> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getExpenses:", error);
  }

  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = EXPENSE_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortField = resolveSortField(filters.sort);
  const ascending = filters.order === "asc";
  const totalBudgetByCurrency = await getTotalBudgetByCurrency(filters);

  if (sortField === "percentage") {
    let sortQuery = supabase.from("expenses").select("id, budget_amount, currency", { count: "exact" });
    sortQuery = applyExpenseFilters(sortQuery, filters);

    const { data: sortRows, error: sortError, count } = await sortQuery;

    if (sortError) {
      throw new Error(sortError.message);
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const sortedRows = sortByPercentage((sortRows ?? []) as ExpenseSortRow[], totalBudgetByCurrency, ascending);
    const pageIds = sortedRows.slice(from, to + 1).map((row) => row.id);

    if (pageIds.length === 0) {
      return {
        expenses: [],
        totalCount,
        page,
        pageSize,
        totalPages,
        totalBudgetByCurrency,
      };
    }

    const { data, error } = await supabase.from("expenses").select(expenseSelect).in("id", pageIds);

    if (error) {
      throw new Error(error.message);
    }

    return {
      expenses: orderExpensesByIds(
        (data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>)),
        pageIds,
      ),
      totalCount,
      page,
      pageSize,
      totalPages,
      totalBudgetByCurrency,
    };
  }

  let query = supabase.from("expenses").select(expenseSelect, { count: "exact" });
  query = applyExpenseFilters(query, filters);
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
    totalBudgetByCurrency,
  };
}

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getExpenseById:", error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const expense = normalizeExpense(data as Record<string, unknown>);

  // If the expense has a payment proof path, generate a short-lived signed URL
  if (expense.payment_proof_path) {
    const signedUrl = await getPaymentProofSignedUrl(expense.payment_proof_path);
    expense.proofSignedUrl = signedUrl;
  }

  return expense;
}
