import Link from "next/link";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { ExpenseActionsMenu } from "@/components/expenses/expense-actions-menu";
import { ExpensePercentageBar } from "@/components/expenses/expense-percentage-bar";
import { Card } from "@/components/ui/card";
import {
  calculateExpensePaidPercent,
  formatCurrency,
  formatExpenseDate,
  formatLabel,
} from "@/lib/expenses/format";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import type { ExpenseFilters, ExpenseSortField, ExpenseWithRelations } from "@/lib/expenses/types";

type ProjectExpenseListProps = {
  expenses: ExpenseWithRelations[];
  filters: ExpenseFilters;
  basePath: string;
  hasSearch: boolean;
  hasCategoryOrVendorFilter: boolean;
  addExpenseHref: string;
};

function SortableHeader({
  basePath,
  field,
  label,
  filters,
}: {
  basePath: string;
  field: ExpenseSortField;
  label: string;
  filters: ExpenseFilters;
}) {
  const isActive = filters.sort === field;
  const nextOrder = isActive && filters.order !== "asc" ? "asc" : "desc";
  const href = `${basePath}${buildExpenseQueryString(
    {
      ...filters,
      sort: field,
      order: nextOrder,
      page: undefined,
    },
    { omitProjectId: true },
  )}`;

  return (
    <th aria-sort={isActive ? (filters.order === "asc" ? "ascending" : "descending") : "none"} scope="col">
      <Link className={`expense-sort-link${isActive ? " expense-sort-link-active" : ""}`} href={href}>
        {label}
        {isActive ? (filters.order === "asc" ? " ↑" : " ↓") : null}
      </Link>
    </th>
  );
}

function PaymentProofIndicator({ expense }: { expense: ExpenseWithRelations }) {
  if (!expense.payment_proof_path) {
    return null;
  }

  return (
    <span
      aria-label="Payment proof attached"
      className="expense-proof-indicator"
      title={expense.payment_proof_filename || "Payment proof attached"}
    >
      📄 Proof
    </span>
  );
}

export function ProjectExpenseList({
  expenses,
  filters,
  basePath,
  hasSearch,
  hasCategoryOrVendorFilter,
  addExpenseHref,
}: ProjectExpenseListProps) {
  if (expenses.length === 0) {
    const title = hasSearch
      ? "No expenses match your search."
      : hasCategoryOrVendorFilter
        ? "No expenses match the selected filters."
        : "No expenses yet.";
    const description = hasSearch || hasCategoryOrVendorFilter
      ? "Try adjusting your search or filters."
      : "Start adding expenses to track this Project.";

    return (
      <section aria-labelledby="all-expenses-heading" className="project-expense-list-section">
        <h2 className="project-expense-list-heading" id="all-expenses-heading">All Expenses</h2>
        <Card className="list-empty-card">
          <h3>{title}</h3>
          <p>{description}</p>
          {!hasSearch && !hasCategoryOrVendorFilter ? (
            <Link className="button button-small" href={addExpenseHref}>
              + Add Expense
            </Link>
          ) : null}
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="all-expenses-heading" className="project-expense-list-section">
      <h2 className="project-expense-list-heading" id="all-expenses-heading">All Expenses</h2>

      <ul className="project-expense-mobile-list" role="list">
        {expenses.map((expense) => {
          const paidPercent = calculateExpensePaidPercent(
            expense.budget_amount,
            expense.paid_amount,
          );

          return (
            <li key={expense.id}>
              <Card className="project-expense-mobile-card">
                <div className="project-expense-mobile-card-top">
                  <div>
                    <h3>{expense.description}</h3>
                    <p className="project-expense-mobile-date">{formatExpenseDate(expense.date)}</p>
                  </div>
                  <ExpenseActionsMenu expense={expense} />
                </div>

                <p className="project-expense-mobile-meta">
                  {expense.category?.name ?? "Uncategorized"}
                  {expense.vendor?.name ? ` · ${expense.vendor.name}` : ""}
                </p>

                <dl className="project-expense-mobile-metrics">
                  <div>
                    <dt>Budget</dt>
                    <dd>{formatCurrency(expense.budget_amount, expense.currency)}</dd>
                  </div>
                  <div>
                    <dt>Paid</dt>
                    <dd>{formatCurrency(expense.paid_amount, expense.currency)}</dd>
                  </div>
                  <div>
                    <dt>Remaining</dt>
                    <dd>{formatCurrency(expense.balance, expense.currency)}</dd>
                  </div>
                </dl>

                <ExpensePercentageBar percent={paidPercent} labelSuffix=" paid" />

                <div className="project-expense-mobile-card-footer">
                  <span className={`status-badge status-${expense.status}`}>
                    {formatLabel(expense.status)}
                  </span>
                  <PaymentProofIndicator expense={expense} />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="category-table-card project-expense-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table project-expense-table">
            <caption className="sr-only">All project expenses</caption>
            <thead>
              <tr>
                <SortableHeader basePath={basePath} field="date" filters={filters} label="Date" />
                <SortableHeader
                  basePath={basePath}
                  field="description"
                  filters={filters}
                  label="Description"
                />
                <th scope="col">Category</th>
                <th scope="col">Vendor</th>
                <SortableHeader
                  basePath={basePath}
                  field="budget_amount"
                  filters={filters}
                  label="Expense Budget"
                />
                <SortableHeader
                  basePath={basePath}
                  field="paid_amount"
                  filters={filters}
                  label="Paid"
                />
                <SortableHeader
                  basePath={basePath}
                  field="balance"
                  filters={filters}
                  label="Remaining"
                />
                <th scope="col">Paid %</th>
                <SortableHeader basePath={basePath} field="status" filters={filters} label="Status" />
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const paidPercent = calculateExpensePaidPercent(
                  expense.budget_amount,
                  expense.paid_amount,
                );

                return (
                  <tr key={expense.id}>
                    <td>{formatExpenseDate(expense.date)}</td>
                    <td>
                      <div className="project-expense-description-cell">
                        <span>{expense.description}</span>
                        <PaymentProofIndicator expense={expense} />
                      </div>
                    </td>
                    <td>{expense.category?.name ?? "—"}</td>
                    <td>{expense.vendor?.name ?? "—"}</td>
                    <td>{formatCurrency(expense.budget_amount, expense.currency)}</td>
                    <td>{formatCurrency(expense.paid_amount, expense.currency)}</td>
                    <td>{formatCurrency(expense.balance, expense.currency)}</td>
                    <td className="expense-percentage-cell">
                      <ExpensePercentageBar
                        percent={paidPercent}
                        labelSuffix=" paid"
                      />
                    </td>
                    <td>
                      <span className={`status-badge status-${expense.status}`}>
                        {formatLabel(expense.status)}
                      </span>
                    </td>
                    <td className="category-table-actions project-expense-desktop-actions">
                      <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                        Edit
                      </Link>
                      <CopyExpenseButton expense={expense} />
                      <DeleteExpenseButton
                        expenseDescription={expense.description}
                        expenseId={expense.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
