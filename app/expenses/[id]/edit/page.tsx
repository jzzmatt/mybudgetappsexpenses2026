import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseEditForm } from "@/components/expenses/expense-edit-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getExpenseById } from "@/lib/expenses/queries";
import { getTranslations } from "@/lib/i18n/server";
import { getProjects } from "@/lib/projects/queries";
import { getVendors } from "@/lib/vendors/queries";

type EditExpensePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditExpensePage({ params, searchParams }: EditExpensePageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const { t } = await getTranslations();
  const [expense, categories, projects, vendors] = await Promise.all([
    getExpenseById(id),
    getCategories(),
    getProjects(),
    getVendors(),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <AppShell description={t("expenses.editTitle")} title={t("expenses.editTitle")}>
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ExpenseEditForm
        categories={categories}
        expense={expense}
        projects={projects}
        vendors={vendors}
      />
      <p className="category-footer-link">
        <Link className="auth-link" href="/expenses">
          {t("expenses.title")}
        </Link>
      </p>
    </AppShell>
  );
}
