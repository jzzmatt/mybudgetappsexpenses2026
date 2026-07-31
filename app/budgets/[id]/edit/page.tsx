import Link from "next/link";
import { notFound } from "next/navigation";
import { BudgetEditForm } from "@/components/budgets/budget-edit-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getBudgetById } from "@/lib/budgets/queries";
import { getProjects } from "@/lib/projects/queries";

type EditBudgetPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditBudgetPage({ params, searchParams }: EditBudgetPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const [budget, categories, projects] = await Promise.all([
    getBudgetById(id),
    getCategories(),
    getProjects(),
  ]);

  if (!budget) {
    notFound();
  }

  return (
    <AppShell description={`Update details for ${budget.name}.`} title="Edit budget">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <BudgetEditForm budget={budget} categories={categories} projects={projects} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/budgets">
          Back to budgets
        </Link>
      </p>
    </AppShell>
  );
}
