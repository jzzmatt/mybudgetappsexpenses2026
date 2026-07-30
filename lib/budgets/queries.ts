import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type {
  Budget,
  BudgetFilters,
  BudgetRelation,
  BudgetWithRelations,
  BudgetWithUsage,
} from "@/lib/budgets/types";

const budgetSelect = `
  id,
  user_id,
  category_id,
  project_id,
  name,
  amount,
  currency,
  month,
  year,
  created_at,
  updated_at,
  category:categories(id, name),
  project:projects(id, name)
`;

type ExpenseUsageRow = {
  year: number;
  month: number;
  category_id: string | null;
  project_id: string | null;
  currency: string;
  paid_amount: number;
};

function normalizeRelation(
  value: BudgetRelation | BudgetRelation[] | null | undefined,
): BudgetRelation | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeBudget(row: Record<string, unknown>): BudgetWithRelations {
  const { category, project, ...budget } = row;

  return {
    ...(budget as Budget),
    category: normalizeRelation(category as BudgetRelation | BudgetRelation[] | null),
    project: normalizeRelation(project as BudgetRelation | BudgetRelation[] | null),
  };
}

function expenseMatchesBudget(expense: ExpenseUsageRow, budget: Budget) {
  if (expense.year !== budget.year) {
    return false;
  }

  if (budget.month !== null && expense.month !== budget.month) {
    return false;
  }

  if (budget.category_id && expense.category_id !== budget.category_id) {
    return false;
  }

  if (budget.project_id && expense.project_id !== budget.project_id) {
    return false;
  }

  if (expense.currency !== budget.currency) {
    return false;
  }

  return true;
}

function calculatePaidAmount(budget: Budget, expenses: ExpenseUsageRow[]) {
  return expenses
    .filter((expense) => expenseMatchesBudget(expense, budget))
    .reduce((total, expense) => total + Number(expense.paid_amount), 0);
}

function attachUsage(budget: BudgetWithRelations, expenses: ExpenseUsageRow[]): BudgetWithUsage {
  const paid_amount = calculatePaidAmount(budget, expenses);
  const remaining = Math.max(0, Number(budget.amount) - paid_amount);
  const progress_percent =
    Number(budget.amount) > 0 ? Math.min(100, (paid_amount / Number(budget.amount)) * 100) : 0;

  return {
    ...budget,
    paid_amount,
    remaining,
    progress_percent,
  };
}

async function getExpenseUsageRows(): Promise<ExpenseUsageRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("year, month, category_id, project_id, currency, paid_amount");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExpenseUsageRow[];
}

export async function getBudgets(filters: BudgetFilters = {}): Promise<BudgetWithUsage[]> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("budgets")
    .select(budgetSelect)
    .order("year", { ascending: false })
    .order("month", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true });

  const trimmedSearch = filters.search?.trim();

  if (trimmedSearch) {
    query = query.ilike("name", `%${trimmedSearch}%`);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters.currency) {
    query = query.eq("currency", filters.currency);
  }

  if (filters.year) {
    query = query.eq("year", filters.year);
  }

  if (filters.month) {
    query = query.eq("month", filters.month);
  }

  const [{ data, error }, expenses] = await Promise.all([query, getExpenseUsageRows()]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    attachUsage(normalizeBudget(row as Record<string, unknown>), expenses),
  );
}

export async function getBudgetById(id: string): Promise<BudgetWithUsage | null> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const [{ data, error }, expenses] = await Promise.all([
    supabase.from("budgets").select(budgetSelect).eq("id", id).maybeSingle(),
    getExpenseUsageRows(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return data ? attachUsage(normalizeBudget(data as Record<string, unknown>), expenses) : null;
}
