import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpensePagination } from "@/components/expenses/expense-pagination";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { ProjectExpensesSummary } from "@/components/projects/project-expenses-summary";
import { parseExpenseSearchParams } from "@/lib/expenses/params";
import { getExpenses } from "@/lib/expenses/queries";
import type { ExpenseListResult } from "@/lib/expenses/types";
import { getProjectById, getProjectExpenseTotals } from "@/lib/projects/queries";
import type { ProjectExpenseTotals } from "@/lib/projects/types";

type ProjectExpensesPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectExpensesPage({ params, searchParams }: ProjectExpensesPageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const filters = {
    ...parseExpenseSearchParams(queryParams),
    projectId: id,
  };
  const basePath = `/projects/${id}/expenses`;

  let result: ExpenseListResult = {
    expenses: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };
  let loadError: string | undefined;
  let totals: ProjectExpenseTotals = { byCurrency: {}, currencies: [] };

  try {
    [result, totals] = await Promise.all([getExpenses(filters), getProjectExpenseTotals(id)]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load expenses. Check your Supabase and Clerk integration.";
  }

  const hasActiveFilters = Boolean(filters.search || filters.sort || filters.order);

  return (
    <AppShell
      actions={<PageActionButton href="/expenses/new">Add expense</PageActionButton>}
      description={`All expenses linked to ${project.name}.`}
      title={`${project.name} expenses`}
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        <p className="category-footer-link">
          <Link className="auth-link" href="/projects">
            Back to projects
          </Link>
        </p>
        <ProjectExpensesSummary project={project} totals={totals} />
        <ExpenseList
          basePath={basePath}
          emptyMessage={`No expenses are linked to ${project.name} yet.`}
          expenses={result.expenses}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          hideProjectColumn
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
