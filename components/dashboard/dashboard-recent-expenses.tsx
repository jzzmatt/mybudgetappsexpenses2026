import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { formatExpenseDate, formatLabel } from "@/lib/expenses/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { DashboardRecentExpense } from "@/lib/dashboard/types";

type DashboardRecentExpensesProps = {
  currency: ExpenseCurrency;
  expenses: DashboardRecentExpense[];
};

export function DashboardRecentExpenses({ currency, expenses }: DashboardRecentExpensesProps) {
  return (
    <Card className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>Recent Expenses</h2>
      </div>
      {expenses.length === 0 ? (
        <p className="dashboard-table-empty">No expenses recorded for this period.</p>
      ) : (
        <div className="category-table-wrap">
          <table className="category-table dashboard-table">
            <caption className="sr-only">Recent expenses</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatExpenseDate(expense.date)}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category}</td>
                  <td>{formatCurrency(expense.amount, currency)}</td>
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
