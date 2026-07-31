import Link from "next/link";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import type { ExpenseFilters } from "@/lib/expenses/types";

type ExpensePaginationProps = {
  filters: ExpenseFilters;
  page: number;
  totalPages: number;
  totalCount: number;
  basePath?: string;
};

export function ExpensePagination({
  filters,
  page,
  totalPages,
  totalCount,
  basePath = "/expenses",
}: ExpensePaginationProps) {
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
    <nav aria-label="Expense pagination" className="expense-pagination">
      <p className="expense-pagination-summary">
        Page {page} of {totalPages} ({totalCount} total)
      </p>
      <div className="expense-pagination-actions">
        {previousHref ? (
          <Link className="button button-outline button-small" href={previousHref}>
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="button button-outline button-small expense-pagination-disabled"
          >
            Previous
          </span>
        )}
        {nextHref ? (
          <Link className="button button-outline button-small" href={nextHref}>
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="button button-outline button-small expense-pagination-disabled"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
