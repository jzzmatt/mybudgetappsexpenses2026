import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import { getTranslations } from "@/lib/i18n/server";
import type { ProjectFinancialSummary } from "@/lib/projects/types";

type ProjectOverviewKpisProps = {
  financials: ProjectFinancialSummary;
};

export async function ProjectOverviewKpis({ financials }: ProjectOverviewKpisProps) {
  const { t, locale } = await getTranslations();
  const intlLocale = getIntlLocale(locale);

  const {
    projectBudget,
    totalExpenseBudget,
    totalPaid,
    totalExpenseRemaining,
    availableBudget,
    projectPaidPercent,
    allocatedPercent,
    isOverspent,
    expenseCount,
    currency,
  } = financials;

  const items = [
    {
      label: t("projects.totalBudget"),
      value: formatCurrency(projectBudget, currency, locale),
      subtext: `${allocatedPercent.toFixed(1)}% ${t("projects.allocated").toLowerCase()}`,
      variant: "default",
    },
    {
      label: t("projects.totalExpenseBudget"),
      value: formatCurrency(totalExpenseBudget, currency, locale),
      subtext: isOverspent ? t("projects.overspent") : t("projects.expenseBudgetAllocation"),
      variant: isOverspent ? "danger" : "default",
    },
    {
      label: t("projects.totalPaid"),
      value: formatCurrency(totalPaid, currency, locale),
      subtext: `${projectPaidPercent.toFixed(1)}% ${t("projects.projectBudgetUsage").toLowerCase()}`,
      variant: "paid",
    },
    {
      label: t("projects.totalRemaining"),
      value: formatCurrency(totalExpenseRemaining, currency, locale),
      subtext: t("expenses.remaining"),
      variant: "remaining",
    },
    {
      label: t("projects.availableBudget"),
      value: formatCurrency(availableBudget, currency, locale),
      subtext: availableBudget < 0 ? t("projects.overspent") : t("projects.allocated"),
      variant: availableBudget < 0 ? "danger" : "default",
    },
    {
      label: t("projects.numberOfExpenses"),
      value: expenseCount.toLocaleString(intlLocale),
      subtext: t("nav.projectWorkspace"),
      variant: "default",
    },
  ];

  return (
    <div className="project-kpi-grid">
      {items.map((item) => (
        <Card
          className={`project-kpi-card ${
            item.variant === "paid"
              ? "project-expenses-paid-card"
              : item.variant === "remaining"
                ? "project-expenses-remaining-card"
                : item.variant === "danger"
                  ? "project-kpi-card-danger"
                  : ""
          }`}
          key={item.label}
        >
          <p className="project-kpi-label">{item.label}</p>
          <p className="project-kpi-value">{item.value}</p>
          <p className="project-kpi-subtext">{item.subtext}</p>
        </Card>
      ))}
    </div>
  );
}
