import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type { Project, ProjectExpenseTotals } from "@/lib/projects/types";

export async function getProjects(search?: string): Promise<Project[]> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("id, user_id, name, description, status, created_at, updated_at")
    .order("name", { ascending: true });

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    query = query.or(
      `name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%,status.ilike.%${trimmedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProjectById(id: string): Promise<Project | null> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id, name, description, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
