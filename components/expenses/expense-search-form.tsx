import Link from "next/link";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import { getTranslations } from "@/lib/i18n/server";
import type { ExpenseFilters } from "@/lib/expenses/types";

type ExpenseSearchFormProps = {
  filters: ExpenseFilters;
};

export async function ExpenseSearchForm({ filters }: ExpenseSearchFormProps) {
  const { t } = await getTranslations();
  const clearHref = `/expenses${buildExpenseQueryString({
    ...filters,
    search: undefined,
    page: undefined,
  })}`;

  return (
    <form action="/expenses" className="list-search-form" method="get" role="search">
      {filters.categoryId ? <input name="category" type="hidden" value={filters.categoryId} /> : null}
      {filters.projectId ? <input name="project" type="hidden" value={filters.projectId} /> : null}
      {filters.vendorId ? <input name="vendor" type="hidden" value={filters.vendorId} /> : null}
      {filters.status ? <input name="status" type="hidden" value={filters.status} /> : null}
      {filters.currency ? <input name="currency" type="hidden" value={filters.currency} /> : null}
      {filters.year ? <input name="year" type="hidden" value={filters.year} /> : null}
      {filters.month ? <input name="month" type="hidden" value={filters.month} /> : null}
      {filters.sort ? <input name="sort" type="hidden" value={filters.sort} /> : null}
      {filters.order ? <input name="order" type="hidden" value={filters.order} /> : null}
      <label className="sr-only" htmlFor="expense-search">
        {t("expenses.searchPlaceholder")}
      </label>
      <input
        defaultValue={filters.search}
        id="expense-search"
        name="q"
        placeholder={t("expenses.searchPlaceholder")}
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        {t("common.search")}
      </button>
      {filters.search ? (
        <Link className="auth-link" href={clearHref}>
          {t("common.clear")}
        </Link>
      ) : null}
    </form>
  );
}
