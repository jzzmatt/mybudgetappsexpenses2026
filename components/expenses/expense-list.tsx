import Link from "next/link";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { ExpensePercentageBar } from "@/components/expenses/expense-percentage-bar";
import { Card } from "@/components/ui/card";
import {
  calculateExpenseBudgetPercentage,
  formatCurrency,
  formatExpenseDate,
} from "@/lib/expenses/format";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
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

export async function ExpenseList({
  expenses,
  filters,
  hasActiveFilters,
  totalBudgetByCurrency,
  basePath = "/expenses",
  emptyMessage,
  hideProjectColumn = false,
}: ExpenseListProps) {
  const { t, locale } = await getTranslations();
  const omitProjectId = basePath.startsWith("/projects/") && basePath.endsWith("/expenses");
  const defaultEmptyMessage = hasActiveFilters
    ? t("expenses.noExpensesFiltersHint")
    : t("expenses.noExpensesDescription");

  if (expenses.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>{t("expenses.noExpensesFound")}</h2>
        <p>{emptyMessage ?? defaultEmptyMessage}</p>
        <Link className="button button-small" href="/expenses/new">
          {t("common.createExpense")}
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
                <p className="list-mobile-card-date">{formatExpenseDate(expense.date, locale)}</p>
              </div>
              <span className={`status-badge status-${expense.status}`}>
                {translateEnum(t, "status", expense.status)}
              </span>
            </div>
            <dl className="list-mobile-card-details">
              <div>
                <dt>{t("expenses.category")}</dt>
                <dd>{expense.category?.name ?? t("common.dash")}</dd>
              </div>
              <div>
                <dt>{t("expenses.expenseBudget")}</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.budget_amount), expense.currency, locale)}
                </dd>
              </div>
              <div>
                <dt>{t("expenses.paid")}</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.paid_amount), expense.currency, locale)}
                </dd>
              </div>
              <div>
                <dt>{t("expenses.balance")}</dt>
                <dd className="list-mobile-card-amount">
                  {formatCurrency(Number(expense.balance), expense.currency, locale)}
                </dd>
              </div>
              <div>
                <dt>{t("expenses.percentage")}</dt>
                <dd>
                  <ExpensePercentageBar
                    percent={getExpensePercentage(expense, totalBudgetByCurrency)}
                  />
                </dd>
              </div>
              {expense.payment_reference || expense.payment_proof_path ? (
                <div>
                  <dt>{t("expenses.refProof")}</dt>
                  <dd>
                    {expense.payment_reference ? `${expense.payment_reference} ` : ""}
                    {expense.payment_proof_path ? "📎 PDF" : ""}
                  </dd>
                </div>
              ) : null}
              {hideProjectColumn ? null : (
                <div>
                  <dt>{t("expenses.project")}</dt>
                  <dd>{expense.project?.name ?? t("common.dash")}</dd>
                </div>
              )}
              <div>
                <dt>{t("expenses.vendor")}</dt>
                <dd>{expense.vendor?.name ?? t("common.dash")}</dd>
              </div>
            </dl>
            <div className="list-mobile-card-actions">
              <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                {t("common.edit")}
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
            <caption className="sr-only">{t("expenses.title")}</caption>
            <thead>
              <tr>
                <SortableHeader
                  basePath={basePath}
                  field="date"
                  filters={filters}
                  label={t("expenses.date")}
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="description"
                  filters={filters}
                  label={t("expenses.description")}
                  omitProjectId={omitProjectId}
                />
                <th scope="col">{t("expenses.category")}</th>
                {hideProjectColumn ? null : <th scope="col">{t("expenses.project")}</th>}
                <th scope="col">{t("expenses.vendor")}</th>
                <th scope="col">{t("expenses.refProof")}</th>
                <th scope="col">{t("projects.currency")}</th>
                <SortableHeader
                  basePath={basePath}
                  field="budget_amount"
                  filters={filters}
                  label={t("expenses.expenseBudget")}
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="percentage"
                  filters={filters}
                  label={t("expenses.percentage")}
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="paid_amount"
                  filters={filters}
                  label={t("expenses.paid")}
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="balance"
                  filters={filters}
                  label={t("expenses.balance")}
                  omitProjectId={omitProjectId}
                />
                <SortableHeader
                  basePath={basePath}
                  field="status"
                  filters={filters}
                  label={t("expenses.status")}
                  omitProjectId={omitProjectId}
                />
                <th scope="col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatExpenseDate(expense.date, locale)}</td>
                  <td>{expense.description}</td>
                  <td>{expense.category?.name ?? t("common.dash")}</td>
                  {hideProjectColumn ? null : <td>{expense.project?.name ?? t("common.dash")}</td>}
                  <td>{expense.vendor?.name ?? t("common.dash")}</td>
                  <td>
                    {expense.payment_reference ? (
                      <span className="expense-ref-tag" title={`Ref: ${expense.payment_reference}`}>
                        {expense.payment_reference}
                      </span>
                    ) : null}
                    {expense.payment_proof_path ? (
                      <span
                        className="expense-proof-icon"
                        title={expense.payment_proof_filename || t("common.proofAttached")}
                      >
                        📎 PDF
                      </span>
                    ) : null}
                    {!expense.payment_reference && !expense.payment_proof_path ? t("common.dash") : null}
                  </td>
                  <td>{expense.currency}</td>
                  <td>{formatCurrency(expense.budget_amount, expense.currency, locale)}</td>
                  <td className="expense-percentage-cell">
                    <ExpensePercentageBar
                      percent={getExpensePercentage(expense, totalBudgetByCurrency)}
                    />
                  </td>
                  <td>{formatCurrency(expense.paid_amount, expense.currency, locale)}</td>
                  <td>{formatCurrency(expense.balance, expense.currency, locale)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status}`}>
                      {translateEnum(t, "status", expense.status)}
                    </span>
                  </td>
                  <td className="category-table-actions">
                    <Link className="auth-link" href={`/expenses/${expense.id}/edit`}>
                      {t("common.edit")}
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
