import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import { getTranslations } from "@/lib/i18n/server";
import { getProjects } from "@/lib/projects/queries";
import { getVendors } from "@/lib/vendors/queries";

type NewExpensePageProps = {
  searchParams: Promise<{ error?: string; project?: string }>;
};

export default async function NewExpensePage({ searchParams }: NewExpensePageProps) {
  const { error, project: preselectedProjectId } = await searchParams;
  const { t } = await getTranslations();
  const [categories, projects, vendors] = await Promise.all([
    getCategories(),
    getProjects(),
    getVendors(),
  ]);

  return (
    <AppShell title={t("expenses.newTitle")}>
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ExpenseCreateForm
        categories={categories}
        preselectedProjectId={preselectedProjectId}
        projects={projects}
        vendors={vendors}
      />
    </AppShell>
  );
}
