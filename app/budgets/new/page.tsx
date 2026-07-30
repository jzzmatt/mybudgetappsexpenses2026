import Link from "next/link";
import { BudgetCreateForm } from "@/components/budgets/budget-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getProjects } from "@/lib/projects/queries";

type NewBudgetPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewBudgetPage({ searchParams }: NewBudgetPageProps) {
  const { error } = await searchParams;
  const [categories, projects] = await Promise.all([getCategories(), getProjects()]);

  return (
    <AppShell description="Add a new budget to track spending limits." title="New budget">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <BudgetCreateForm categories={categories} projects={projects} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/budgets">
          Back to budgets
        </Link>
      </p>
    </AppShell>
  );
}
