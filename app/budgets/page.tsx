import Link from "next/link";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetToolbar } from "@/components/budgets/budget-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import type { Category } from "@/lib/categories/types";
import { parseBudgetSearchParams } from "@/lib/budgets/params";
import { getBudgets } from "@/lib/budgets/queries";
import type { BudgetWithUsage } from "@/lib/budgets/types";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";

type BudgetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const params = await searchParams;
  const filters = parseBudgetSearchParams(params);

  let budgets: BudgetWithUsage[] = [];
  let loadError: string | undefined;
  let categories: Category[] = [];
  let projects: Project[] = [];

  try {
    [budgets, categories, projects] = await Promise.all([
      getBudgets(filters),
      getCategories(),
      getProjects(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load budgets. Check your Supabase and Clerk integration.";
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.projectId ||
      filters.currency ||
      filters.year ||
      filters.month,
  );

  return (
    <AppShell
      description="Set spending limits and track remaining balance with progress."
      title="Budgets"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <BudgetToolbar categories={categories} filters={filters} projects={projects} />
      <BudgetList budgets={budgets} hasActiveFilters={hasActiveFilters} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
