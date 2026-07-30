import Link from "next/link";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpensePagination } from "@/components/expenses/expense-pagination";
import { ExpenseToolbar } from "@/components/expenses/expense-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import type { Category } from "@/lib/categories/types";
import { parseExpenseSearchParams } from "@/lib/expenses/params";
import { getExpenses } from "@/lib/expenses/queries";
import type { ExpenseListResult } from "@/lib/expenses/types";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";
import { getVendors } from "@/lib/vendors/queries";
import type { Vendor } from "@/lib/vendors/types";

type ExpensesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const filters = parseExpenseSearchParams(params);

  let result: ExpenseListResult = {
    expenses: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };
  let loadError: string | undefined;

  let categories: Category[] = [];
  let projects: Project[] = [];
  let vendors: Vendor[] = [];

  try {
    [result, categories, projects, vendors] = await Promise.all([
      getExpenses(filters),
      getCategories(),
      getProjects(),
      getVendors(),
    ]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load expenses. Check your Supabase and Clerk integration.";
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.projectId ||
      filters.vendorId ||
      filters.status ||
      filters.year ||
      filters.month,
  );

  return (
    <AppShell description="Track spending with search, filters, and pagination." title="Expenses">
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ExpenseToolbar
        categories={categories}
        filters={filters}
        projects={projects}
        vendors={vendors}
      />
      <ExpenseList
        expenses={result.expenses}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
      />
      <ExpensePagination
        filters={filters}
        page={result.page}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
