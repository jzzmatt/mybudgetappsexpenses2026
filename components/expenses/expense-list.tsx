import Link from "next/link";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { ExpensePercentageBar } from "@/components/expenses/expense-percentage-bar";
import { Card } from "@/components/ui/card";
import {
  calculateExpenseBudgetPercentage,
  formatCurrency,
  formatExpenseDate,
  formatLabel,
} from "@/lib/expenses/format";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import type {
  ExpenseBudgetTotals,
  ExpenseFilters,
  ExpenseSortField,
  ExpenseWithRelations,
} from "@/lib/expenses/types";

type ExpenseListProps = {
  expenses: ExpenseWithRelations[];
  filters: ExpenseFilters;
  hasActiveFilters: boolean;
  totalBudgetByCurrency: ExpenseBudgetTotals;
  basePath?: string;
  emptyMessage?: string;
  hideProjectColumn?: boolean;
};

function SortableHeader({
  basePath,
  field,
  label,
  filters,
  omitProjectId,
}: {
  basePath: string;
  field: ExpenseSortField;
  label: string;
  filters: ExpenseFilters;
  omitProjectId?: boolean;
}) {
  const isActive = (filters.sort ?? "date") === field;
  const nextOrder = isActive && filters.order !== "asc" ? "asc" : "desc";
  const href = `${basePath}${buildExpenseQueryString(
    {
      ...filters,
      sort: field,
      order: nextOrder,
      page: undefined,
    },
    { omitProjectId },
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

function getExpensePercentage(
  expense: ExpenseWithRelations,
  totalBudgetByCurrency: ExpenseBudgetTotals,
) {
  return calculateExpenseBudgetPercentage(
    expense.budget_amount,
    expense.currency,
    totalBudgetByCurrency,
  );
}

export function ExpenseList({
  expenses,
  filters,
  hasActiveFilters,
  totalBudgetByCurrency,
  basePath = "/expenses",
  emptyMessage,
  hideProjectColumn = false,
}: ExpenseListProps) {
  const omitProjectId = basePath.startsWith("/projects/") && basePath.endsWith("/expenses");
  const defaultEmptyMessage = hasActiveFilters
    ? "No expenses match your current search or filters. Try adjusting them or create a new expense."
    : "Create your first expense to start tracking spending.";

  if (expenses.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>No expenses found</h2>
        <p>{emptyMessage ?? defaultEmptyMessage}</p>
        <Link className="button button-small" href="/expenses/new">
          Create expense
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="list-mobile-cards">
        {expenses.map((expense) => (
          <Card className="list-mobile-card" key={expense.id}>
            <div className="list-mobile-card-header">
              <div>
                <h3>{expense.description}</h3>
                <p className="list-mobile-card-date">{formatExpenseDate(expense.date)}</p>
              </div>
              <span className={`status-badge status-${expense.status}`}>
                {formatLabel(expense.status)}
              </span>
            </div>
            <dl className="list-mobile-card-details">
              <div>
                <dt>Category</dt>
                <dd>{expense.category?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Expense Budget</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.budget_amount), expense.currency)}
                </dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.paid_amount), expense.currency)}
                </dd>
              </div>
              <div>
                <dt>Balance</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.balance), expense.currency)}
                </dd>
              </div>
              <div>
                <dt>Percentage</dt>
                <dd>
                  <ExpensePercentageBar
                    percent={getExpensePercentage(expense, totalBudgetByCurrency)}
                  />
                </dd>
              </div>
              {hideProjectColumn ? null : (
                <div>
                  <dt>Project</dt>
                  <dd>{expense.project?.name ?? "—"}</dd>
                </div>
              )}
              <div>
                <dt>Vendor</dt>
                <dd>{expense.vendor?.name ?? "—"}</dd>
              </div>
            </dl>
            <div className="list-mobile-card-actions">
              <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                Edit
              </Link>
              <CopyExpenseButton expense={expense} />
              <DeleteExpenseButton
                expenseDescription={expense.description}
                expenseId={expense.id}
              />
            </div>
          </Card>
        ))}
      </div>
      <Card className="category-table-card list-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table expense-table">
            <caption className="sr-only">Expenses</caption>
            <thead>
              <tr>
                <SortableHeader
                  basePath={basePath}
                  field="date"
                  filters={filters}
                  label="Date"
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="description"
                  filters={filters}
                  label="Description"
                  omitProjectId={omitProjectId}
                />
                <th scope="col">Category</th>
                {hideProjectColumn ? null : <th scope="col">Project</th>}
                <th scope="col">Vendor</th>
                <th scope="col">Currency</th>
                <SortableHeader
                  basePath={basePath}
                  field="budget_amount"
                  filters={filters}
                  label="Expense Budget"
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="percentage"
                  filters={filters}
                  label="Percentage"
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="paid_amount"
                  filters={filters}
                  label="Paid"
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="balance"
                  filters={filters}
                  label="Balance"
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="status"
                  filters={filters}
                  label="Status"
                  omitProjectId={omitProjectId}
                />
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatExpenseDate(expense.date)}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category?.name ?? "—"}</td>
                  {hideProjectColumn ? null : <td>{expense.project?.name ?? "—"}</td>}
                  <td>{expense.vendor?.name ?? "—"}</td>
                  <td>{expense.currency}</td>
                  <td>{formatCurrency(expense.budget_amount, expense.currency)}</td>
                  <td className="expense-percentage-cell">
                    <ExpensePercentageBar
                      percent={getExpensePercentage(expense, totalBudgetByCurrency)}
                    />
                  </td>
                  <td>{formatCurrency(expense.paid_amount, expense.currency)}</td>
                  <td>{formatCurrency(expense.balance, expense.currency)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status}`}>
                      {formatLabel(expense.status)}
                    </span>
                  </td>
                  <td className="category-table-actions">
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
