import Link from "next/link";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import { getTranslations } from "@/lib/i18n/server";
import type { ExpenseFilters } from "@/lib/expenses/types";

type ExpensePaginationProps = {
  filters: ExpenseFilters;
  page: number;
  totalPages: number;
  totalCount: number;
  basePath?: string;
};

export async function ExpensePagination({
  filters,
  page,
  totalPages,
  totalCount,
  basePath = "/expenses",
}: ExpensePaginationProps) {
  const { t } = await getTranslations();
  const omitProjectId = basePath.startsWith("/projects/") && basePath.endsWith("/expenses");
  const queryOptions = { omitProjectId };

  if (totalCount === 0) {
    return null;
  }

  const previousHref =
    page > 1
      ? `${basePath}${buildExpenseQueryString({ ...filters, page: page - 1 }, queryOptions)}`
      : undefined;
  const nextHref =
    page < totalPages
      ? `${basePath}${buildExpenseQueryString({ ...filters, page: page + 1 }, queryOptions)}`
      : undefined;

  return (
    <nav aria-label={t("pagination.label")} className="expense-pagination">
      <p className="expense-pagination-summary">
        {t("pagination.summary", { page, totalPages, totalCount })}
      </p>
      <div className="expense-pagination-actions">
        {previousHref ? (
          <Link className="button button-outline button-small" href={previousHref}>
            {t("common.previous")}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="button button-outline button-small expense-pagination-disabled"
          >
            {t("common.previous")}
          </span>
        )}
        {nextHref ? (
          <Link className="button button-outline button-small" href={nextHref}>
            {t("common.next")}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="button button-outline button-small expense-pagination-disabled"
          >
            {t("common.next")}
          </span>
        )}
      </div>
    </nav>
  );
}
