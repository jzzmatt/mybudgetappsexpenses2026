import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import { formatExpenseDate } from "@/lib/expenses/format";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

type ProjectRecentExpensesCardProps = {
  projectId: string;
  currency: ExpenseCurrency;
  expenses: ExpenseWithRelations[];
};

export async function ProjectRecentExpensesCard({
  projectId,
  currency,
  expenses,
}: ProjectRecentExpensesCardProps) {
  const { t, locale } = await getTranslations();

  return (
    <Card className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>{t("projects.recentExpenses")}</h2>
        <Link className="auth-link dashboard-table-link" href={`/projects/${projectId}/expenses`}>
          {t("expenses.allExpenses")}
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="dashboard-table-empty">{t("projects.noRecentExpenses")}</p>
      ) : (
        <div className="category-table-wrap">
          <table className="category-table dashboard-table">
            <caption className="sr-only">{t("projects.recentExpenses")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("expenses.date")}</th>
                <th scope="col">{t("expenses.description")}</th>
                <th scope="col">{t("expenses.category")}</th>
                <th scope="col">{t("projects.projectBudget")}</th>
                <th scope="col">{t("expenses.paid")}</th>
                <th scope="col">{t("expenses.status")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatExpenseDate(expense.date, locale)}</td>
                  <td>
                    <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                      {expense.description}
                    </Link>
                  </td>
                  <td>{expense.category?.name ?? t("common.dash")}</td>
                  <td>{formatCurrency(expense.budget_amount, currency, locale)}</td>
                  <td>{formatCurrency(expense.paid_amount, currency, locale)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status}`}>
                      {translateEnum(t, "status", expense.status)}
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
