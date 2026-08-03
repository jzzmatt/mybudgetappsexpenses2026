import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { formatExpenseDate } from "@/lib/expenses/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { DashboardPendingExpense } from "@/lib/dashboard/types";

type DashboardPendingExpensesProps = {
  currency: ExpenseCurrency;
  expenses: DashboardPendingExpense[];
};

export function DashboardPendingExpenses({ currency, expenses }: DashboardPendingExpensesProps) {
  return (
    <Card className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>Pending Expenses</h2>
        <Link className="auth-link dashboard-table-link" href="/expenses?status=pending">
          View all
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="dashboard-table-empty">No pending expenses for this period.</p>
      ) : (
        <div className="dashboard-table-scroll">
          <div className="category-table-wrap">
            <table className="category-table dashboard-table">
              <caption className="sr-only">Pending expenses</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Budget</th>
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
                    <td>{expense.category}</td>
                    <td>{formatCurrency(expense.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
