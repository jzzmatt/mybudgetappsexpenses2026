import { BulkPaymentProvider } from "@/components/expenses/bulk-payment";
import { ExpenseList } from "@/components/expenses/expense-list";
import { PaymentResultBanner } from "@/components/expenses/payment-result-banner";
import { ExpensePagination } from "@/components/expenses/expense-pagination";
import { ExpenseToolbar } from "@/components/expenses/expense-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { getCategories } from "@/lib/categories/queries";
import type { Category } from "@/lib/categories/types";
import { parseExpenseSearchParams } from "@/lib/expenses/params";
import { getExpenses, listPayableExpenses } from "@/lib/expenses/queries";
import { toBulkExpenseOption } from "@/lib/payments/bulk";
import type { ExpenseListResult } from "@/lib/expenses/types";
import { getTranslations } from "@/lib/i18n/server";
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
  const { t } = await getTranslations();

  let result: ExpenseListResult = {
    expenses: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalBudgetByCurrency: {},
  };
  let loadError: string | undefined;

  let categories: Category[] = [];
  let projects: Project[] = [];
  let vendors: Vendor[] = [];
  let payable = { total: 0, expenses: [] as ReturnType<typeof toBulkExpenseOption>[] };

  try {
    [result, categories, projects, vendors, payable] = await Promise.all([
      getExpenses(filters),
      getCategories(),
      getProjects(),
      getVendors(),
      listPayableExpenses(filters),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("expenses.loadError");
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.categoryId ||
      filters.projectId ||
      filters.vendorId ||
      filters.status ||
      filters.currency ||
      filters.year ||
      filters.month,
  );

  return (
    <AppShell
      actions={<PageActionButton href="/expenses/new">{t("common.add")}</PageActionButton>}
      title={t("expenses.title")}
    >
      <PaymentResultBanner paid={params.paid === "1"} paymentId={typeof params.payment === "string" ? params.payment : undefined} />
      {typeof params.error === "string" ? (
        <p className="form-error page-error" role="alert">
          {params.error}
        </p>
      ) : null}
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        <ExpenseToolbar
          categories={categories}
          filters={filters}
          projects={projects}
          vendors={vendors}
        />
        <BulkPaymentProvider
          matching={payable.expenses}
          matchingTotal={payable.total}
          returnTo="/expenses"
          visible={result.expenses.map(toBulkExpenseOption)}
        >
          <ExpenseList
            expenses={result.expenses}
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            totalBudgetByCurrency={result.totalBudgetByCurrency}
          />
        </BulkPaymentProvider>
        <ExpensePagination
          filters={filters}
          page={result.page}
          totalCount={result.totalCount}
          totalPages={result.totalPages}
        />
      </ListPageContent>
    </AppShell>
  );
}
