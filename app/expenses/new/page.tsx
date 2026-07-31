import Link from "next/link";
import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getProjects } from "@/lib/projects/queries";
import { getVendors } from "@/lib/vendors/queries";

type NewExpensePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewExpensePage({ searchParams }: NewExpensePageProps) {
  const { error } = await searchParams;
  const [categories, projects, vendors] = await Promise.all([
    getCategories(),
    getProjects(),
    getVendors(),
  ]);

  return (
    <AppShell description="Add a new expense record." title="New expense">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ExpenseCreateForm categories={categories} projects={projects} vendors={vendors} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/expenses">
          Back to expenses
        </Link>
      </p>
    </AppShell>
  );
}
