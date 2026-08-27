import { Card } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { calculateExpensePaidPercent, formatExpensePercentage } from "@/lib/expenses/format";
import type { ExpenseWithRelations } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";

type TopExpensesSectionProps = {
  expenses: ExpenseWithRelations[];
  project: Project;
};

export function TopExpensesSection({ expenses, project }: TopExpensesSectionProps) {
  if (expenses.length === 0) {
    return (
      <section aria-labelledby="top-expenses-heading" className="top-expenses-section">
        <h2 className="top-expenses-heading" id="top-expenses-heading">Top 5 Expenses</h2>
        <Card className="top-expenses-empty">
          <p>No expenses available yet.</p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="top-expenses-heading" className="top-expenses-section">
      <h2 className="top-expenses-heading" id="top-expenses-heading">Top 5 Expenses</h2>

      <div className="top-expenses-mobile-cards">
        {expenses.map((expense, index) => {
          const currency = isExpenseCurrency(expense.currency)
            ? (expense.currency as ExpenseCurrency)
            : project.currency;
          const remaining = Number(expense.balance);
          const paidPercent = calculateExpensePaidPercent(
            expense.budget_amount,
            expense.paid_amount,
          );

          return (
            <Card className="top-expense-mobile-card" key={expense.id}>
              <div className="top-expense-mobile-card-header">
                <span className="top-expense-rank">#{index + 1}</span>
                <div>
                  <h3>{expense.description}</h3>
                  <p className="top-expense-mobile-category">
                    {expense.category?.name ?? "Uncategorized"}
                  </p>
                </div>
              </div>
              <dl className="top-expense-mobile-metrics">
                <div>
                  <dt>Budget</dt>
                  <dd>{formatCurrency(expense.budget_amount, currency)}</dd>
                </div>
                <div>
                  <dt>Paid</dt>
                  <dd>{formatCurrency(expense.paid_amount, currency)}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>{formatCurrency(remaining, currency)}</dd>
                </div>
              </dl>
              <p className="top-expense-mobile-paid-label">
                {formatExpensePercentage(paidPercent)} paid
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="top-expenses-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table top-expenses-table">
            <caption className="sr-only">Top expenses by budget amount</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Expense</th>
                <th scope="col">Category</th>
                <th scope="col">Budget</th>
                <th scope="col">Paid</th>
                <th scope="col">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => {
                const currency = isExpenseCurrency(expense.currency)
                  ? (expense.currency as ExpenseCurrency)
                  : project.currency;

                return (
                  <tr key={expense.id}>
                    <td>{index + 1}</td>
                    <td>{expense.description}</td>
                    <td>{expense.category?.name ?? "—"}</td>
                    <td>{formatCompactCurrency(expense.budget_amount, currency)}</td>
                    <td>{formatCompactCurrency(expense.paid_amount, currency)}</td>
                    <td>{formatCompactCurrency(expense.balance, currency)}</td>
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
