import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_EXPENSE_CURRENCY, isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { calculateProjectFinancialSummary } from "@/lib/projects/calculations";
import type { CategoryChartDatum, MonthlyChartDatum } from "@/lib/dashboard/types";
import type { Expense, ExpenseRelation, ExpenseWithRelations } from "@/lib/expenses/types";
import type {
  Project,
  ProjectCategoryAnalysis,
  ProjectExpenseTotals,
  ProjectOverviewData,
  ProjectReportData,
  ProjectVendorAnalysis,
} from "@/lib/projects/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function normalizeProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    budget_amount: Number(row.budget_amount) || 0,
    currency: (isExpenseCurrency(row.currency as string)
      ? (row.currency as ExpenseCurrency)
      : DEFAULT_EXPENSE_CURRENCY),
    status: String(row.status || "active"),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

export async function getProjects(search?: string): Promise<Project[]> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getProjects:", error);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("id, user_id, name, description, budget_amount, currency, status, created_at, updated_at")
    .order("name", { ascending: true });

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    query = query.or(
      `name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%,status.ilike.%${trimmedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    // If budget_amount or currency column doesn't exist yet on projects table before migration is run, fallback gracefully
    if (error.code === "42703" || error.message?.includes("does not exist")) {
      const fallbackQuery = await supabase
        .from("projects")
        .select("id, user_id, name, description, status, created_at, updated_at")
        .order("name", { ascending: true });

      if (fallbackQuery.error) {
        throw new Error(fallbackQuery.error.message);
      }
      return (fallbackQuery.data ?? []).map((row) => normalizeProject(row as Record<string, unknown>));
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeProject(row as Record<string, unknown>));
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getProjectById:", error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id, name, description, budget_amount, currency, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "42703" || error.message?.includes("does not exist")) {
      const fallbackQuery = await supabase
        .from("projects")
        .select("id, user_id, name, description, status, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (fallbackQuery.error) {
        throw new Error(fallbackQuery.error.message);
      }
      return fallbackQuery.data ? normalizeProject(fallbackQuery.data as Record<string, unknown>) : null;
    }
    throw new Error(error.message);
  }

  return data ? normalizeProject(data as Record<string, unknown>) : null;
}

export async function getProjectOverview(projectId: string): Promise<ProjectOverviewData | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getProjectOverview:", error);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: rawExpenses, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("project_id", projectId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const expenses = (rawExpenses ?? []).map((row) => normalizeExpense(row as Record<string, unknown>));
  const financials = calculateProjectFinancialSummary(project, expenses);

  // Group by category for charts
  const categoryMap = new Map<string, CategoryChartDatum>();
  for (const exp of expenses) {
    const catName = exp.category?.name || "Uncategorized";
    const existing = categoryMap.get(catName) ?? { category: catName, budget: 0, paid: 0 };
    existing.budget += Number(exp.budget_amount) || 0;
    existing.paid += Number(exp.paid_amount) || 0;
    categoryMap.set(catName, existing);
  }
  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.budget - a.budget);

  // Group by month for current year
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Map<number, MonthlyChartDatum>();
  for (let m = 1; m <= 12; m += 1) {
    monthlyMap.set(m, {
      month: MONTH_LABELS[m - 1],
      monthNumber: m,
      budget: 0,
      paid: 0,
    });
  }
  for (const exp of expenses) {
    if (exp.year === currentYear) {
      const existing = monthlyMap.get(exp.month);
      if (existing) {
        existing.budget += Number(exp.budget_amount) || 0;
        existing.paid += Number(exp.paid_amount) || 0;
      }
    }
  }
  const monthlyData = Array.from(monthlyMap.values());
  const recentExpenses = expenses.slice(0, 5);

  return {
    project,
    financials,
    categoryData,
    monthlyData,
    recentExpenses,
  };
}

export async function getProjectReportData(projectId: string): Promise<ProjectReportData | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getProjectReportData:", error);
  }

  const project = await getProjectById(projectId);
  if (!project) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data: rawExpenses, error } = await supabase
    .from("expenses")
    .select(expenseSelect)
    .eq("project_id", projectId)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const expenses = (rawExpenses ?? []).map((row) => normalizeExpense(row as Record<string, unknown>));
  const financials = calculateProjectFinancialSummary(project, expenses);

  // Group by category for analysis & charts
  const categoryMap = new Map<string, { count: number; budget: number; paid: number }>();
  for (const exp of expenses) {
    const catName = exp.category?.name || "Uncategorized";
    const existing = categoryMap.get(catName) ?? { count: 0, budget: 0, paid: 0 };
    existing.count += 1;
    existing.budget += Number(exp.budget_amount) || 0;
    existing.paid += Number(exp.paid_amount) || 0;
    categoryMap.set(catName, existing);
  }

  const categoryAnalysis: ProjectCategoryAnalysis[] = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      expenseCount: stats.count,
      budget: stats.budget,
      paid: stats.paid,
      remaining: stats.budget - stats.paid,
      percentOfBudget:
        financials.totalExpenseBudget > 0 ? (stats.budget / financials.totalExpenseBudget) * 100 : 0,
    }))
    .sort((a, b) => b.budget - a.budget);

  const categoryChartData: CategoryChartDatum[] = categoryAnalysis.map((item) => ({
    category: item.category,
    budget: item.budget,
    paid: item.paid,
  }));

  // Group by vendor
  const vendorMap = new Map<string, { count: number; budget: number; paid: number }>();
  for (const exp of expenses) {
    const vendorName = exp.vendor?.name || "Unassigned";
    const existing = vendorMap.get(vendorName) ?? { count: 0, budget: 0, paid: 0 };
    existing.count += 1;
    existing.budget += Number(exp.budget_amount) || 0;
    existing.paid += Number(exp.paid_amount) || 0;
    vendorMap.set(vendorName, existing);
  }

  const vendorAnalysis: ProjectVendorAnalysis[] = Array.from(vendorMap.entries())
    .map(([vendor, stats]) => ({
      vendor,
      expenseCount: stats.count,
      budget: stats.budget,
      paid: stats.paid,
      remaining: stats.budget - stats.paid,
    }))
    .sort((a, b) => b.paid - a.paid);

  // Group by month for current year
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Map<number, MonthlyChartDatum>();
  for (let m = 1; m <= 12; m += 1) {
    monthlyMap.set(m, {
      month: MONTH_LABELS[m - 1],
      monthNumber: m,
      budget: 0,
      paid: 0,
    });
  }
  for (const exp of expenses) {
    if (exp.year === currentYear) {
      const existing = monthlyMap.get(exp.month);
      if (existing) {
        existing.budget += Number(exp.budget_amount) || 0;
        existing.paid += Number(exp.paid_amount) || 0;
      }
    }
  }
  const monthlyChartData = Array.from(monthlyMap.values());

  return {
    project,
    financials,
    categoryAnalysis,
    vendorAnalysis,
    categoryChartData,
    monthlyChartData,
    expenses,
    generatedAt: new Date().toISOString(),
  };
}

export async function getProjectExpenseTotals(projectId: string): Promise<ProjectExpenseTotals> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("budget_amount, paid_amount, balance, currency")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  const byCurrency: ProjectExpenseTotals["byCurrency"] = {};
  const currencies = new Set<string>();

  for (const row of data ?? []) {
    if (!isExpenseCurrency(row.currency)) {
      continue;
    }

    const currency = row.currency as ExpenseCurrency;
    const current = byCurrency[currency] ?? { totalBudget: 0, totalPaid: 0, totalBalance: 0 };

    current.totalBudget += Number(row.budget_amount);
    current.totalPaid += Number(row.paid_amount);
    current.totalBalance += Number(row.balance);
    byCurrency[currency] = current;
    currencies.add(currency);
  }

  return {
    byCurrency,
    currencies: Array.from(currencies).sort(),
  };
}
