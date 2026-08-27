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
} from "@/lib/expenses/format";
import { buildExpenseQueryString } from "@/lib/expenses/params";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
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

function PaymentProofIndicator({
  expense,
  label,
}: {
  expense: ExpenseWithRelations;
  label: string;
}) {
  if (!expense.payment_proof_path) {
    return null;
  }

  return (
    <span
      aria-label={label}
      className="expense-proof-indicator"
      title={expense.payment_proof_filename || label}
    >
      {label}
    </span>
  );
}

export async function ProjectExpenseList({
  expenses,
  filters,
  basePath,
  hasSearch,
  hasCategoryOrVendorFilter,
  addExpenseHref,
}: ProjectExpenseListProps) {
  const { t, locale } = await getTranslations();
  const paidSuffix = ` ${t("expenses.paidPercent")}`;

  if (expenses.length === 0) {
    const title = hasSearch
      ? t("expenses.noSearchResults")
      : hasCategoryOrVendorFilter
        ? t("expenses.noFilterResults")
        : t("expenses.noExpenses");
    const description = hasSearch || hasCategoryOrVendorFilter
      ? t("expenses.noExpensesFiltersHint")
      : t("expenses.noExpensesDescription");

    return (
      <section aria-labelledby="all-expenses-heading" className="project-expense-list-section">
        <h2 className="project-expense-list-heading" id="all-expenses-heading">
          {t("expenses.allExpenses")}
        </h2>
        <Card className="list-empty-card">
          <h3>{title}</h3>
          <p>{description}</p>
          {!hasSearch && !hasCategoryOrVendorFilter ? (
            <Link className="button button-small" href={addExpenseHref}>
              {t("common.addExpense")}
            </Link>
          ) : null}
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="all-expenses-heading" className="project-expense-list-section">
      <h2 className="project-expense-list-heading" id="all-expenses-heading">
        {t("expenses.allExpenses")}
      </h2>

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
                    <p className="project-expense-mobile-date">
                      {formatExpenseDate(expense.date, locale)}
                    </p>
                  </div>
                  <ExpenseActionsMenu expense={expense} />
                </div>

                <p className="project-expense-mobile-meta">
                  {expense.category?.name ?? t("common.uncategorized")}
                  {expense.vendor?.name ? ` · ${expense.vendor.name}` : ""}
                </p>

                <dl className="project-expense-mobile-metrics">
                  <div>
                    <dt>{t("projects.projectBudget")}</dt>
                    <dd>{formatCurrency(expense.budget_amount, expense.currency, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t("expenses.paid")}</dt>
                    <dd>{formatCurrency(expense.paid_amount, expense.currency, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t("expenses.remaining")}</dt>
                    <dd>{formatCurrency(expense.balance, expense.currency, locale)}</dd>
                  </div>
                </dl>

                <ExpensePercentageBar percent={paidPercent} labelSuffix={paidSuffix} />

                <div className="project-expense-mobile-card-footer">
                  <span className={`status-badge status-${expense.status}`}>
                    {translateEnum(t, "status", expense.status)}
                  </span>
                  <PaymentProofIndicator
                    expense={expense}
                    label={t("expenses.proofIndicator")}
                  />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="category-table-card project-expense-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table project-expense-table">
            <caption className="sr-only">{t("expenses.allExpenses")}</caption>
            <thead>
              <tr>
                <SortableHeader basePath={basePath} field="date" filters={filters} label={t("expenses.date")} />
                <SortableHeader
                  basePath={basePath}
                  field="description"
                  filters={filters}
                  label={t("expenses.description")}
                />
                <th scope="col">{t("expenses.category")}</th>
                <th scope="col">{t("expenses.vendor")}</th>
                <SortableHeader
                  basePath={basePath}
                  field="budget_amount"
                  filters={filters}
                  label={t("expenses.expenseBudget")}
                />
                <SortableHeader
                  basePath={basePath}
                  field="paid_amount"
                  filters={filters}
                  label={t("expenses.paid")}
                />
                <SortableHeader
                  basePath={basePath}
                  field="balance"
                  filters={filters}
                  label={t("expenses.remaining")}
                />
                <th scope="col">{t("expenses.paidPercent")}</th>
                <SortableHeader
                  basePath={basePath}
                  field="status"
                  filters={filters}
                  label={t("expenses.status")}
                />
                <th scope="col">{t("common.actions")}</th>
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
                    <td>{formatExpenseDate(expense.date, locale)}</td>
                    <td>
                      <div className="project-expense-description-cell">
                        <span>{expense.description}</span>
                        <PaymentProofIndicator
                          expense={expense}
                          label={t("expenses.proofIndicator")}
                        />
                      </div>
                    </td>
                    <td>{expense.category?.name ?? t("common.dash")}</td>
                    <td>{expense.vendor?.name ?? t("common.dash")}</td>
                    <td>{formatCurrency(expense.budget_amount, expense.currency, locale)}</td>
                    <td>{formatCurrency(expense.paid_amount, expense.currency, locale)}</td>
                    <td>{formatCurrency(expense.balance, expense.currency, locale)}</td>
                    <td className="expense-percentage-cell">
                      <ExpensePercentageBar percent={paidPercent} labelSuffix={paidSuffix} />
                    </td>
                    <td>
                      <span className={`status-badge status-${expense.status}`}>
                        {translateEnum(t, "status", expense.status)}
                      </span>
                    </td>
                    <td className="category-table-actions project-expense-desktop-actions">
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
