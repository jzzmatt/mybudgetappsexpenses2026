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

async function buildExpenseSearchOrFilter(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, search: string) {
  const trimmedSearch = search.trim();
  const parts = [
    `description.ilike.%${trimmedSearch}%`,
    `notes.ilike.%${trimmedSearch}%`,
    `payment_reference.ilike.%${trimmedSearch}%`,
  ];

  const [{ data: categories }, { data: vendors }] = await Promise.all([
    supabase.from("categories").select("id").ilike("name", `%${trimmedSearch}%`),
    supabase.from("vendors").select("id").ilike("name", `%${trimmedSearch}%`),
  ]);

  const categoryIds = (categories ?? []).map((row) => row.id);
  const vendorIds = (vendors ?? []).map((row) => row.id);

  if (categoryIds.length > 0) {
    parts.push(`category_id.in.(${categoryIds.join(",")})`);
  }

  if (vendorIds.length > 0) {
    parts.push(`vendor_id.in.(${vendorIds.join(",")})`);
  }

  return parts.join(",");
}

async function applyExpenseFilters(
  query: FilterableQuery,
  filters: ExpenseFilters,
  supabase?: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const trimmedSearch = filters.search?.trim();
  let nextQuery = query;

  if (trimmedSearch) {
    if (supabase) {
      const orFilter = await buildExpenseSearchOrFilter(supabase, trimmedSearch);
      nextQuery = nextQuery.or(orFilter);
    } else {
      nextQuery = nextQuery.or(
        `description.ilike.%${trimmedSearch}%,notes.ilike.%${trimmedSearch}%,payment_reference.ilike.%${trimmedSearch}%`,
      );
    }
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
  query = await applyExpenseFilters(query, filters, supabase);

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
    sortQuery = await applyExpenseFilters(sortQuery, filters, supabase);

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
  query = await applyExpenseFilters(query, filters, supabase);
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

/**
 * Returns the highest-budget expenses for a project (entire workspace, not paginated page).
 */
export async function getTopProjectExpenses(projectId: string, limit = 5): Promise<ExpenseWithRelations[]> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getTopProjectExpenses:", error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("project_id", projectId)
    .order("budget_amount", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>));
}
