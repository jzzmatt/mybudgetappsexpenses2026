import { Card } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { calculateExpensePaidPercent, formatExpensePercentage } from "@/lib/expenses/format";
import { getTranslations } from "@/lib/i18n/server";
import type { ExpenseWithRelations } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";

type TopExpensesSectionProps = {
  expenses: ExpenseWithRelations[];
  project: Project;
};

export async function TopExpensesSection({ expenses, project }: TopExpensesSectionProps) {
  const { t, locale } = await getTranslations();

  if (expenses.length === 0) {
    return (
      <section aria-labelledby="top-expenses-heading" className="top-expenses-section">
        <h2 className="top-expenses-heading" id="top-expenses-heading">{t("expenses.top5Title")}</h2>
        <Card className="top-expenses-empty">
          <p>{t("expenses.top5Empty")}</p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="top-expenses-heading" className="top-expenses-section">
      <h2 className="top-expenses-heading" id="top-expenses-heading">{t("expenses.top5Title")}</h2>

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
                <span className="top-expense-rank">{t("expenses.rank")}{index + 1}</span>
                <div>
                  <h3>{expense.description}</h3>
                  <p className="top-expense-mobile-category">
                    {expense.category?.name ?? t("common.uncategorized")}
                  </p>
                </div>
              </div>
              <dl className="top-expense-mobile-metrics">
                <div>
                  <dt>{t("projects.projectBudget")}</dt>
                  <dd>{formatCurrency(expense.budget_amount, currency, locale)}</dd>
                </div>
                <div>
                  <dt>{t("expenses.paid")}</dt>
                  <dd>{formatCurrency(expense.paid_amount, currency, locale)}</dd>
                </div>
                <div>
                  <dt>{t("expenses.remaining")}</dt>
                  <dd>{formatCurrency(remaining, currency, locale)}</dd>
                </div>
              </dl>
              <p className="top-expense-mobile-paid-label">
                {formatExpensePercentage(paidPercent)} {t("expenses.paidPercent")}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="top-expenses-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table top-expenses-table">
            <caption className="sr-only">{t("expenses.top5Title")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("expenses.rank")}</th>
                <th scope="col">{t("expenses.description")}</th>
                <th scope="col">{t("expenses.category")}</th>
                <th scope="col">{t("projects.projectBudget")}</th>
                <th scope="col">{t("expenses.paid")}</th>
                <th scope="col">{t("expenses.remaining")}</th>
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
                    <td>{expense.category?.name ?? t("common.dash")}</td>
                    <td>{formatCompactCurrency(expense.budget_amount, currency, locale)}</td>
                    <td>{formatCompactCurrency(expense.paid_amount, currency, locale)}</td>
                    <td>{formatCompactCurrency(expense.balance, currency, locale)}</td>
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
