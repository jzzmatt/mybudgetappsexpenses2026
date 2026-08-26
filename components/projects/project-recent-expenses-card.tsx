import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatExpenseDate, formatLabel } from "@/lib/expenses/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

type ProjectRecentExpensesCardProps = {
  projectId: string;
  currency: ExpenseCurrency;
  expenses: ExpenseWithRelations[];
};

export function ProjectRecentExpensesCard({
  projectId,
  currency,
  expenses,
}: ProjectRecentExpensesCardProps) {
  return (
    <Card className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>Recent Expenses</h2>
        <Link className="auth-link dashboard-table-link" href={`/projects/${projectId}/expenses`}>
          View all expenses
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="dashboard-table-empty">No expenses recorded in this project yet.</p>
      ) : (
        <div className="category-table-wrap">
          <table className="category-table dashboard-table">
            <caption className="sr-only">Recent workspace expenses</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Budget</th>
                <th scope="col">Paid</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatExpenseDate(expense.date)}</td>
                  <td>
                    <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                      {expense.description}
                    </Link>
                  </td>
                  <td>{expense.category?.name ?? "—"}</td>
                  <td>{formatCurrency(expense.budget_amount, currency)}</td>
                  <td>{formatCurrency(expense.paid_amount, currency)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status}`}>
                      {formatLabel(expense.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
