import Link from "next/link";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatExpenseDate, formatLabel } from "@/lib/expenses/format";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import type { ExpenseFilters, ExpenseSortField, ExpenseWithRelations } from "@/lib/expenses/types";

type ExpenseListProps = {
  expenses: ExpenseWithRelations[];
  filters: ExpenseFilters;
  hasActiveFilters: boolean;
};

function SortableHeader({
  field,
  label,
  filters,
}: {
  field: ExpenseSortField;
  label: string;
  filters: ExpenseFilters;
}) {
  const isActive = (filters.sort ?? "date") === field;
  const nextOrder = isActive && filters.order !== "asc" ? "asc" : "desc";
  const href = `/expenses${buildExpenseQueryString({
    ...filters,
    sort: field,
    order: nextOrder,
    page: undefined,
  })}`;

  return (
    <th scope="col">
      <Link className={`expense-sort-link${isActive ? " expense-sort-link-active" : ""}`} href={href}>
        {label}
        {isActive ? (filters.order === "asc" ? " ↑" : " ↓") : null}
      </Link>
    </th>
  );
}

export function ExpenseList({ expenses, filters, hasActiveFilters }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No expenses found</h2>
        <p>
          {hasActiveFilters
            ? "No expenses match your current search or filters. Try adjusting them or create a new expense."
            : "Create your first expense to start tracking spending."}
        </p>
        <Link className="auth-link" href="/expenses/new">
          Create expense
        </Link>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table expense-table">
          <thead>
            <tr>
              <SortableHeader field="date" filters={filters} label="Date" />
              <SortableHeader field="description" filters={filters} label="Description" />
              <th scope="col">Category</th>
              <th scope="col">Project</th>
              <th scope="col">Vendor</th>
              <th scope="col">Currency</th>
              <SortableHeader field="budget_amount" filters={filters} label="Budget" />
              <SortableHeader field="paid_amount" filters={filters} label="Paid" />
              <SortableHeader field="balance" filters={filters} label="Balance" />
              <SortableHeader field="status" filters={filters} label="Status" />
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{formatExpenseDate(expense.date)}</td>
                <td>{expense.description}</td>
                <td>{expense.category?.name ?? "—"}</td>
                <td>{expense.project?.name ?? "—"}</td>
                <td>{expense.vendor?.name ?? "—"}</td>
                <td>{expense.currency}</td>
                <td>{formatCurrency(expense.budget_amount, expense.currency)}</td>
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
  );
}
