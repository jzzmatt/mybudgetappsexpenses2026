import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectExpenseList } from "@/components/expenses/project-expense-list";
import { ProjectExpenseToolbar } from "@/components/expenses/project-expense-toolbar";
import { ExpensePagination } from "@/components/expenses/expense-pagination";
import { TopExpensesSection } from "@/components/expenses/top-expenses-section";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { ProjectExpensesSummary } from "@/components/projects/project-expenses-summary";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { getCategories } from "@/lib/categories/queries";
import { getProjectExpenseFilters, buildExpenseQueryString } from "@/lib/expenses/params";
import { getExpenses, getTopProjectExpenses } from "@/lib/expenses/queries";
import type { ExpenseListResult } from "@/lib/expenses/types";
import { getTranslations } from "@/lib/i18n/server";
import { getProjectById, getProjectExpenseTotals } from "@/lib/projects/queries";
import type { ProjectExpenseTotals } from "@/lib/projects/types";
import { getVendors } from "@/lib/vendors/queries";

type ProjectExpensesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectExpensesPage({ params, searchParams }: ProjectExpensesPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { t } = await getTranslations();
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const filters = getProjectExpenseFilters(id, queryParams);
  const basePath = `/projects/${id}/expenses`;
  const addExpenseHref = `/expenses/new?project=${project.id}`;

  let result: ExpenseListResult = {
    expenses: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalBudgetByCurrency: {},
  };
  let loadError: string | undefined;
  let totals: ProjectExpenseTotals = { byCurrency: {}, currencies: [], expenseCount: 0 };
  let topExpenses: Awaited<ReturnType<typeof getTopProjectExpenses>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let vendors: Awaited<ReturnType<typeof getVendors>> = [];

  try {
    [result, totals, topExpenses, categories, vendors] = await Promise.all([
      getExpenses(filters),
      getProjectExpenseTotals(id),
      getTopProjectExpenses(id, 5),
      getCategories(),
      getVendors(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("expenses.loadError");
  }

  const hasSearch = Boolean(filters.search);
  const hasCategoryOrVendorFilter = Boolean(filters.categoryId || filters.vendorId);

  return (
    <AppShell
      actions={
        <PageActionButton className="project-expenses-header-add" href={addExpenseHref}>
          {t("common.addExpense")}
        </PageActionButton>
      }
      description={
        project.description ?? t("projects.expensesDescription", { name: project.name })
      }
      title={project.name}
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent className="project-expenses-page">
        <div className="project-workspace-topbar">
          <Link className="auth-link" href="/projects">
            {t("nav.backToProjects")}
          </Link>
          <ProjectWorkspaceNav activeTab="expenses" projectId={project.id} projectName={project.name} />
        </div>

        <ProjectExpensesSummary project={project} totals={totals} />

        <Link className="button project-expenses-mobile-add" href={addExpenseHref}>
          {t("common.addExpense")}
        </Link>

        <ProjectExpenseToolbar
          key={buildExpenseQueryString(filters, { omitProjectId: true })}
          basePath={basePath}
          categories={categories}
          filters={filters}
          vendors={vendors}
        />

        <TopExpensesSection expenses={topExpenses} project={project} />

        <ProjectExpenseList
          addExpenseHref={addExpenseHref}
          basePath={basePath}
          expenses={result.expenses}
          filters={filters}
          hasCategoryOrVendorFilter={hasCategoryOrVendorFilter}
          hasSearch={hasSearch}
        />

        <ExpensePagination
          basePath={basePath}
          filters={filters}
          page={result.page}
          totalCount={result.totalCount}
          totalPages={result.totalPages}
        />
      </ListPageContent>
    </AppShell>
  );
}
