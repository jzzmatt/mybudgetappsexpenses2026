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
import { MAX_BULK_EXPENSES, toBulkExpenseOption, type BulkExpenseOption } from "@/lib/payments/bulk";

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
  paid_at,
  payment_note,
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
    paid_at: expense.paid_at ? String(expense.paid_at) : null,
    payment_note: expense.payment_note ? String(expense.payment_note) : null,
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

function buildExpenseSearchOrParts(
  search: string,
  categoryIds: string[] = [],
  vendorIds: string[] = [],
) {
  const trimmedSearch = search.trim();
  const parts = [
    `description.ilike.%${trimmedSearch}%`,
    `notes.ilike.%${trimmedSearch}%`,
    `payment_reference.ilike.%${trimmedSearch}%`,
  ];

  if (categoryIds.length > 0) {
    parts.push(`category_id.in.(${categoryIds.join(",")})`);
  }

  if (vendorIds.length > 0) {
    parts.push(`vendor_id.in.(${vendorIds.join(",")})`);
  }

  return parts.join(",");
}

async function resolveExpenseSearchRelationIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  search: string,
) {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return { categoryIds: [], vendorIds: [] };
  }

  const [{ data: categories }, { data: vendors }] = await Promise.all([
    supabase.from("categories").select("id").ilike("name", `%${trimmedSearch}%`),
    supabase.from("vendors").select("id").ilike("name", `%${trimmedSearch}%`),
  ]);

  return {
    categoryIds: (categories ?? []).map((row) => row.id),
    vendorIds: (vendors ?? []).map((row) => row.id),
  };
}

function applyExpenseFilters(
  query: FilterableQuery,
  filters: ExpenseFilters,
  searchRelationIds?: { categoryIds: string[]; vendorIds: string[] },
) {
  const trimmedSearch = filters.search?.trim();
  let nextQuery = query;

  if (trimmedSearch) {
    const orFilter = buildExpenseSearchOrParts(
      trimmedSearch,
      searchRelationIds?.categoryIds,
      searchRelationIds?.vendorIds,
    );
    nextQuery = nextQuery.or(orFilter);
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

async function getTotalBudgetByCurrency(
  filters: ExpenseFilters,
  searchRelationIds?: { categoryIds: string[]; vendorIds: string[] },
): Promise<ExpenseBudgetTotals> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("expenses").select("budget_amount, currency");
  query = applyExpenseFilters(query, filters, searchRelationIds);

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
  const searchRelationIds = filters.search?.trim()
    ? await resolveExpenseSearchRelationIds(supabase, filters.search)
    : undefined;
  const totalBudgetByCurrency = await getTotalBudgetByCurrency(filters, searchRelationIds);

  if (sortField === "percentage") {
    let sortQuery = supabase.from("expenses").select("id, budget_amount, currency", { count: "exact" });
    sortQuery = applyExpenseFilters(sortQuery, filters, searchRelationIds);

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
      expenses: await withEvidenceCounts(
        orderExpensesByIds(
          (data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>)),
          pageIds,
        ),
      ),
      totalCount,
      page,
      pageSize,
      totalPages,
      totalBudgetByCurrency,
    };
  }

  let query = supabase.from("expenses").select(expenseSelect, { count: "exact" });
  query = applyExpenseFilters(query, filters, searchRelationIds);
  query = query.order(sortField, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    expenses: await withEvidenceCounts((data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>))),
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

  expense.evidence = await loadExpenseEvidence(expense.id);
  expense.evidenceCount = (expense.evidence?.length ?? 0) + (expense.payment_proof_path ? 1 : 0);

  return expense;
}

async function withEvidenceCounts(expenses: ExpenseWithRelations[]) {
  if (expenses.length === 0) {
    return expenses;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_payment_evidence")
    .select("expense_id")
    .in(
      "expense_id",
      expenses.map((expense) => expense.id),
    );

  if (error) {
    return expenses.map((expense) => ({
      ...expense,
      evidenceCount: expense.payment_proof_path ? 1 : 0,
    }));
  }

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const id = String(row.expense_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return expenses.map((expense) => ({
    ...expense,
    evidenceCount: (counts.get(expense.id) ?? 0) + (expense.payment_proof_path ? 1 : 0),
  }));
}

async function loadExpenseEvidence(expenseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_payment_evidence")
    .select("id, evidence_type, file_name, mime_type, storage_path")
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return Promise.all(
    data.map(async (row) => ({
      id: String(row.id),
      evidenceType: row.evidence_type === "image" ? ("image" as const) : ("receipt" as const),
      fileName: String(row.file_name),
      mimeType: String(row.mime_type),
      signedUrl: await getPaymentProofSignedUrl(String(row.storage_path)),
    })),
  );
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

export async function listPayableExpenses(filters: ExpenseFilters = {}): Promise<{ total: number; expenses: BulkExpenseOption[] }> {
  if (filters.status === "paid") {
    return { total: 0, expenses: [] };
  }

  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in listPayableExpenses:", error);
  }

  const supabase = await createSupabaseServerClient();
  const searchRelationIds = filters.search?.trim()
    ? await resolveExpenseSearchRelationIds(supabase, filters.search)
    : undefined;
  const statuses = filters.status === "pending" || filters.status === "partial" ? [filters.status] : ["pending", "partial"];
  let query = supabase
    .from("expenses")
    .select("id, description, status, currency, budget_amount, paid_amount, category:categories(name), project:projects(name)", { count: "exact" })
    .in("status", statuses)
    .order("date", { ascending: false })
    .limit(MAX_BULK_EXPENSES);
  query = applyExpenseFilters(query, { ...filters, status: undefined }, searchRelationIds);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const expenses = (data ?? []).map((row) =>
    toBulkExpenseOption({
      id: String(row.id),
      description: String(row.description ?? ""),
      status: String(row.status),
      currency: String(row.currency),
      budget_amount: Number(row.budget_amount),
      paid_amount: Number(row.paid_amount),
      category: normalizeRelation(row.category as ExpenseRelation | ExpenseRelation[] | null),
      project: normalizeRelation(row.project as ExpenseRelation | ExpenseRelation[] | null),
    }),
  );
  const available = await excludeReservedExpenses(supabase, expenses);

  return {
    total: available.length === expenses.length ? (count ?? expenses.length) : available.length,
    expenses: available,
  };
}

async function excludeReservedExpenses<T extends { id: string }>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  expenses: T[],
) {
  if (expenses.length === 0) {
    return expenses;
  }

  const ids = expenses.map((expense) => expense.id);
  const { data, error } = await supabase
    .from("payment_expenses")
    .select("expense_id, payment:payments(batch_status)")
    .in("expense_id", ids);

  if (error) {
    return expenses;
  }

  const reserved = new Set(
    (data ?? []).flatMap((row) => {
      const payment = Array.isArray(row.payment) ? row.payment[0] : row.payment;
      const status = payment && "batch_status" in payment ? String(payment.batch_status ?? "") : "";

      if (status === "cancelled") {
        return [];
      }

      return [String(row.expense_id)];
    }),
  );

  return expenses.filter((expense) => !reserved.has(expense.id));
}
