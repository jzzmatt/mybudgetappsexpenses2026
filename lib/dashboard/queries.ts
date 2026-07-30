import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type {
  CategoryChartDatum,
  DashboardData,
  DashboardKpis,
  DashboardPeriod,
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCategoryName(category: ExpenseRow["category"]) {
  if (!category) {
    return "Uncategorized";
  }

  return Array.isArray(category) ? (category[0]?.name ?? "Uncategorized") : category.name;
}

function buildPeriodLabel(period: DashboardPeriod) {
  if (period.month === null) {
    return String(period.year);
  }

  const date = new Date(period.year, period.month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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

function aggregateCategoryData(expenses: ExpenseRow[]): CategoryChartDatum[] {
  const grouped = new Map<string, CategoryChartDatum>();

  for (const expense of expenses) {
    const category = getCategoryName(expense.category);
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

export async function getDashboardData(period: DashboardPeriod): Promise<DashboardData> {
  await ensureUserRecord();

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

  const expenses = (data ?? []) as ExpenseRow[];
  const yearlyQuery = supabase
    .from("expenses")
    .select("month, year, budget_amount, paid_amount, balance, status, category:categories(name)")
    .eq("year", period.year)
    .eq("currency", period.currency);

  const { data: yearlyData, error: yearlyError } = await yearlyQuery;

  if (yearlyError) {
    throw new Error(yearlyError.message);
  }

  const yearlyExpenses = (yearlyData ?? []) as ExpenseRow[];

  return {
    year: period.year,
    month: period.month,
    currency: period.currency,
    periodLabel: buildPeriodLabel(period),
    kpis: aggregateKpis(expenses),
    categoryData: aggregateCategoryData(expenses),
    monthlyData: aggregateMonthlyData(yearlyExpenses, period.year),
  };
}
