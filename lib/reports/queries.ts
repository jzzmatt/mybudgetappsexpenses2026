import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import {
  REPORT_TYPE_LABELS,
  type ReportData,
  type ReportFilters,
  type ReportRow,
  type ReportSummary,
} from "@/lib/reports/types";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ExpenseReportRow = {
  year: number;
  month: number;
  budget_amount: number;
  paid_amount: number;
  balance: number;
  category: { name: string } | { name: string }[] | null;
  project: { name: string } | { name: string }[] | null;
};

function getRelationName(
  relation: { name: string } | { name: string }[] | null,
  fallback: string,
) {
  if (!relation) {
    return fallback;
  }

  return Array.isArray(relation) ? (relation[0]?.name ?? fallback) : relation.name;
}

function buildSummary(rows: ReportRow[]): ReportSummary {
  const total_budget = rows.reduce((total, row) => total + row.budget, 0);
  const total_paid = rows.reduce((total, row) => total + row.paid, 0);
  const remaining = rows.reduce((total, row) => total + row.remaining, 0);
  const utilization_percent = total_budget > 0 ? (total_paid / total_budget) * 100 : 0;

  return {
    total_budget,
    total_paid,
    remaining,
    utilization_percent: Math.min(100, utilization_percent),
  };
}

function buildRow(label: string, budget: number, paid: number): ReportRow {
  const remaining = Math.max(0, budget - paid);
  const utilization_percent = budget > 0 ? Math.min(100, (paid / budget) * 100) : 0;

  return {
    label,
    budget,
    paid,
    remaining,
    utilization_percent,
  };
}

function aggregateMonthly(expenses: ExpenseReportRow[], year: number): ReportRow[] {
  const grouped = new Map<number, ReportRow>();

  for (let month = 1; month <= 12; month += 1) {
    grouped.set(month, buildRow(MONTH_LABELS[month - 1], 0, 0));
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
    current.remaining = Math.max(0, current.budget - current.paid);
    current.utilization_percent =
      current.budget > 0 ? Math.min(100, (current.paid / current.budget) * 100) : 0;
  }

  return Array.from(grouped.values());
}

function aggregateYearly(expenses: ExpenseReportRow[]): ReportRow[] {
  const grouped = new Map<number, ReportRow>();

  for (const expense of expenses) {
    const current = grouped.get(expense.year) ?? buildRow(String(expense.year), 0, 0);
    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
    current.remaining = Math.max(0, current.budget - current.paid);
    current.utilization_percent =
      current.budget > 0 ? Math.min(100, (current.paid / current.budget) * 100) : 0;
    grouped.set(expense.year, current);
  }

  return Array.from(grouped.values()).sort((left, right) =>
    Number(left.label) > Number(right.label) ? -1 : 1,
  );
}

function aggregateByCategory(expenses: ExpenseReportRow[]): ReportRow[] {
  const grouped = new Map<string, ReportRow>();

  for (const expense of expenses) {
    const label = getRelationName(expense.category, "Uncategorized");
    const current = grouped.get(label) ?? buildRow(label, 0, 0);
    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
    current.remaining = Math.max(0, current.budget - current.paid);
    current.utilization_percent =
      current.budget > 0 ? Math.min(100, (current.paid / current.budget) * 100) : 0;
    grouped.set(label, current);
  }

  return Array.from(grouped.values()).sort((left, right) => right.budget - left.budget);
}

function aggregateByProject(expenses: ExpenseReportRow[]): ReportRow[] {
  const grouped = new Map<string, ReportRow>();

  for (const expense of expenses) {
    const label = getRelationName(expense.project, "No project");
    const current = grouped.get(label) ?? buildRow(label, 0, 0);
    current.budget += Number(expense.budget_amount);
    current.paid += Number(expense.paid_amount);
    current.remaining = Math.max(0, current.budget - current.paid);
    current.utilization_percent =
      current.budget > 0 ? Math.min(100, (current.paid / current.budget) * 100) : 0;
    grouped.set(label, current);
  }

  return Array.from(grouped.values()).sort((left, right) => right.budget - left.budget);
}

function buildPeriodLabel(filters: ReportFilters) {
  if (filters.type === "yearly") {
    return "All years";
  }

  if (filters.month !== null) {
    const date = new Date(filters.year, filters.month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return String(filters.year);
}

function buildTitle(filters: ReportFilters) {
  return `${REPORT_TYPE_LABELS[filters.type]} report`;
}

async function fetchExpenses(filters: ReportFilters): Promise<ExpenseReportRow[]> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expenses")
    .select(
      "year, month, budget_amount, paid_amount, balance, category:categories(name), project:projects(name)",
    )
    .eq("currency", filters.currency);

  if (filters.type === "monthly") {
    query = query.eq("year", filters.year);
  } else if (filters.type === "yearly") {
    // No year filter for yearly breakdown.
  } else {
    query = query.eq("year", filters.year);

    if (filters.month !== null) {
      query = query.eq("month", filters.month);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExpenseReportRow[];
}

export async function getReportData(filters: ReportFilters): Promise<ReportData> {
  const expenses = await fetchExpenses(filters);

  let rows: ReportRow[];

  switch (filters.type) {
    case "monthly":
      rows = aggregateMonthly(expenses, filters.year);
      break;
    case "yearly":
      rows = aggregateYearly(expenses);
      break;
    case "category":
      rows = aggregateByCategory(expenses);
      break;
    case "project":
      rows = aggregateByProject(expenses);
      break;
  }

  return {
    type: filters.type,
    title: buildTitle(filters),
    period_label: buildPeriodLabel(filters),
    currency: filters.currency,
    summary: buildSummary(rows),
    rows,
  };
}
