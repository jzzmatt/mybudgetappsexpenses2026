import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import type { Project, ProjectExpenseTotals } from "@/lib/projects/types";

type ProjectExpensesSummaryProps = {
  project: Project;
  totals: ProjectExpenseTotals;
};

export async function ProjectExpensesSummary({ project, totals }: ProjectExpensesSummaryProps) {
  const { t, locale } = await getTranslations();

  const budgetItems = totals.currencies.flatMap((currencyCode) => {
    if (!isExpenseCurrency(currencyCode)) {
      return [];
    }

    const currency = currencyCode as ExpenseCurrency;
    const totalsForCurrency = totals.byCurrency[currency];

    if (!totalsForCurrency) {
      return [];
    }

    const multiCurrency = totals.currencies.length > 1;

    return [
      {
        key: `budget-${currency}`,
        label: multiCurrency
          ? `${t("projects.totalBudget")} (${currency})`
          : t("projects.totalBudget"),
        value: formatCurrency(totalsForCurrency.totalBudget, currency, locale),
        variant: "default" as const,
      },
      {
        key: `paid-${currency}`,
        label: multiCurrency ? `${t("projects.totalPaid")} (${currency})` : t("projects.totalPaid"),
        value: formatCurrency(totalsForCurrency.totalPaid, currency, locale),
        variant: "paid" as const,
      },
      {
        key: `remaining-${currency}`,
        label: multiCurrency
          ? `${t("projects.totalRemaining")} (${currency})`
          : t("projects.totalRemaining"),
        value: formatCurrency(totalsForCurrency.totalBalance, currency, locale),
        variant: "remaining" as const,
      },
    ];
  });

  const items = [
    ...budgetItems,
    {
      key: "expense-count",
      label: t("projects.numberOfExpenses"),
      value: String(totals.expenseCount),
      variant: "default" as const,
    },
  ];

  if (budgetItems.length === 0) {
    items.unshift(
      {
        key: "budget-empty",
        label: t("projects.totalBudget"),
        value: formatCurrency(0, project.currency, locale),
        variant: "default" as const,
      },
      {
        key: "paid-empty",
        label: t("projects.totalPaid"),
        value: formatCurrency(0, project.currency, locale),
        variant: "paid" as const,
      },
      {
        key: "remaining-empty",
        label: t("projects.totalRemaining"),
        value: formatCurrency(0, project.currency, locale),
        variant: "remaining" as const,
      },
    );
  }

  return (
    <div className="budget-summary-grid project-expenses-kpi-grid">
      {items.map((item) => (
        <Card
          className={`budget-summary-card project-expenses-kpi-card${
            item.variant === "paid"
              ? " project-expenses-paid-card"
              : item.variant === "remaining"
                ? " project-expenses-remaining-card"
                : ""
          }`}
          key={item.key}
        >
          <p className="budget-summary-label">{item.label}</p>
          <p className="budget-summary-value">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
