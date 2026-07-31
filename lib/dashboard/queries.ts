import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type {
  CategoryChartDatum,
  DashboardData,
  DashboardKpis,
  DashboardKpiTrends,
  DashboardPeriod,
  DashboardProjectBudget,
  DashboardRecentExpense,
  MonthlyChartDatum,
} from "@/lib/dashboard/types";

type ExpenseRow = {
  month: number;
  year: number;
  budget_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  category: { name: string } | { name: string }[] | null;
};

type RecentExpenseRow = {
  id: string;
  date: string;
  description: string;
  paid_amount: number;
  status: string;
  category: { name: string } | { name: string }[] | null;
};

type ProjectExpenseRow = {
  budget_amount: number;
  paid_amount: number;
  project: { name: string } | { name: string }[] | null;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getRelationName(
  relation: { name: string } | { name: string }[] | null | undefined,
  fallback: string,
) {
  if (!relation) {
    return fallback;
  }

  return Array.isArray(relation) ? (relation[0]?.name ?? fallback) : relation.name;
}

function buildPeriodLabel(period: DashboardPeriod) {
  if (period.month === null) {
    return String(period.year);
  }

  const date = new Date(period.year, period.month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getPreviousPeriod(period: DashboardPeriod): DashboardPeriod {
  if (period.month === null) {
    return {
      year: period.year - 1,
      month: null,
      currency: period.currency,
    };
  }

  if (period.month === 1) {
    return {
      year: period.year - 1,
      month: 12,
      currency: period.currency,
    };
  }

  return {
    year: period.year,
    month: period.month - 1,
    currency: period.currency,
  };
}

function aggregateKpis(expenses: ExpenseRow[]): DashboardKpis {
  return expenses.reduce(
    (totals, expense) => ({
      totalBudget: totals.totalBudget + Number(expense.budget_amount),
      totalPaid: totals.totalPaid + Number(expense.paid_amount),
      remainingBudget: totals.remainingBudget + Number(expense.balance),
      pendingExpenses: totals.pendingExpenses + (expense.status === "pending" ? 1 : 0),
    }),
    {
      totalBudget: 0,
      totalPaid: 0,
      remainingBudget: 0,
      pendingExpenses: 0,
    },
  );
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
}

function buildKpiTrends(current: DashboardKpis, previous: DashboardKpis): DashboardKpiTrends {
  return {
    totalBudget: calculateTrend(current.totalBudget, previous.totalBudget),
    totalPaid: calculateTrend(current.totalPaid, previous.totalPaid),
    remainingBudget: calculateTrend(current.remainingBudget, previous.remainingBudget),
    pendingExpenses: calculateTrend(current.pendingExpenses, previous.pendingExpenses),
  };
}

function aggregateCategoryData(expenses: ExpenseRow[]): CategoryChartDatum[] {
  const grouped = new Map<string, CategoryChartDatum>();

  for (const expense of expenses) {
    const category = getRelationName(expense.category, "Uncategorized");
    const current = grouped.get(category) ?? { category, budget: 0, paid: 0 };
    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
    grouped.set(category, current);
  }

  return Array.from(grouped.values()).sort((left, right) => right.budget - left.budget);
}

function aggregateMonthlyData(expenses: ExpenseRow[], year: number): MonthlyChartDatum[] {
  const grouped = new Map<number, MonthlyChartDatum>();

  for (let month = 1; month <= 12; month += 1) {
    grouped.set(month, {
      month: MONTH_LABELS[month - 1],
      monthNumber: month,
      budget: 0,
      paid: 0,
    });
  }

  for (const expense of expenses) {
    if (expense.year !== year) {
      continue;
    }

    const current = grouped.get(expense.month);
    if (!current) {
      continue;
    }

    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
  }

  return Array.from(grouped.values());
}

function mapRecentExpenses(rows: RecentExpenseRow[]): DashboardRecentExpense[] {
  return rows.map((expense) => ({
    id: expense.id,
    date: expense.date,
    description: expense.description,
    category: getRelationName(expense.category, "Uncategorized"),
    amount: Number(expense.paid_amount),
    status: expense.status,
  }));
}

function aggregateProjectBudgets(rows: ProjectExpenseRow[]): DashboardProjectBudget[] {
  const grouped = new Map<string, DashboardProjectBudget>();

  for (const expense of rows) {
    const project = getRelationName(expense.project, "Unassigned");
    const current = grouped.get(project) ?? { project, budget: 0, paid: 0, progress: 0 };
    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
    grouped.set(project, current);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      progress: item.budget > 0 ? Math.min(100, (item.paid / item.budget) * 100) : 0,
    }))
    .sort((left, right) => right.budget - left.budget);
}

async function fetchExpenses(period: DashboardPeriod) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expenses")
    .select("month, year, budget_amount, paid_amount, balance, status, category:categories(name)")
    .eq("year", period.year)
    .eq("currency", period.currency);

  if (period.month !== null) {
    query = query.eq("month", period.month);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExpenseRow[];
}

export async function getDashboardData(period: DashboardPeriod): Promise<DashboardData> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const previousPeriod = getPreviousPeriod(period);
  const [expenses, previousExpenses, yearlyExpenses] = await Promise.all([
    fetchExpenses(period),
    fetchExpenses(previousPeriod),
    fetchExpenses({ ...period, month: null }),
  ]);

  let recentQuery = supabase
    .from("expenses")
    .select("id, date, description, paid_amount, status, category:categories(name)")
    .eq("year", period.year)
    .eq("currency", period.currency)
    .order("date", { ascending: false })
    .limit(5);

  if (period.month !== null) {
    recentQuery = recentQuery.eq("month", period.month);
  }

  let projectQuery = supabase
    .from("expenses")
    .select("budget_amount, paid_amount, project:projects(name)")
    .eq("year", period.year)
    .eq("currency", period.currency);

  if (period.month !== null) {
    projectQuery = projectQuery.eq("month", period.month);
  }

  const [{ data: recentData, error: recentError }, { data: projectData, error: projectError }] =
    await Promise.all([recentQuery, projectQuery]);

  if (recentError) {
    throw new Error(recentError.message);
  }

  if (projectError) {
    throw new Error(projectError.message);
  }

  const kpis = aggregateKpis(expenses);
  const previousKpis = aggregateKpis(previousExpenses);

  return {
    year: period.year,
    month: period.month,
    currency: period.currency,
    periodLabel: buildPeriodLabel(period),
    kpis,
    kpiTrends: buildKpiTrends(kpis, previousKpis),
    categoryData: aggregateCategoryData(expenses),
    monthlyData: aggregateMonthlyData(yearlyExpenses, period.year),
    recentExpenses: mapRecentExpenses((recentData ?? []) as RecentExpenseRow[]),
    projectBudgets: aggregateProjectBudgets((projectData ?? []) as ProjectExpenseRow[]),
  };
}
