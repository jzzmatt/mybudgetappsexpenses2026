import Link from "next/link";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import type { ExpenseFilters } from "@/lib/expenses/types";

type ExpensePaginationProps = {
  filters: ExpenseFilters;
  page: number;
  totalPages: number;
  totalCount: number;
};

export function ExpensePagination({ filters, page, totalPages, totalCount }: ExpensePaginationProps) {
  if (totalCount === 0) {
    return null;
  }

  const previousHref =
    page > 1
      ? `/expenses${buildExpenseQueryString({ ...filters, page: page - 1 })}`
      : undefined;
  const nextHref =
    page < totalPages
      ? `/expenses${buildExpenseQueryString({ ...filters, page: page + 1 })}`
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
          <span className="button button-outline button-small expense-pagination-disabled">Previous</span>
        )}
        {nextHref ? (
          <Link className="button button-outline button-small" href={nextHref}>
            Next
          </Link>
        ) : (
          <span className="button button-outline button-small expense-pagination-disabled">Next</span>
        )}
      </div>
    </nav>
  );
}
