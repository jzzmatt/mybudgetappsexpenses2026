import { Suspense } from "react";
import { ExpenseCreateFormLoader } from "@/components/expenses/expense-create-form-loader";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getProjects } from "@/lib/projects/queries";
import { getVendors } from "@/lib/vendors/queries";

type NewExpensePageProps = {
  searchParams: Promise<{ error?: string; paste?: string }>;
};

export default async function NewExpensePage({ searchParams }: NewExpensePageProps) {
  const { error } = await searchParams;
  const [categories, projects, vendors] = await Promise.all([
    getCategories(),
    getProjects(),
    getVendors(),
  ]);

  return (
    <AppShell title="New expense">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <Suspense fallback={<p>Loading form…</p>}>
        <ExpenseCreateFormLoader categories={categories} projects={projects} vendors={vendors} />
      </Suspense>
    </AppShell>
  );
}
