import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { getTranslations } from "@/lib/i18n/server";
import type { ProjectFinancialSummary } from "@/lib/projects/types";

type ProjectUsageAllocationCardProps = {
  financials: ProjectFinancialSummary;
};

export async function ProjectUsageAllocationCard({ financials }: ProjectUsageAllocationCardProps) {
  const { t, locale } = await getTranslations();

  const {
    projectBudget,
    totalExpenseBudget,
    totalPaid,
    availableBudget,
    allocatedPercent,
    projectPaidPercent,
    isOverspent,
    currency,
  } = financials;

  const clampedAllocated = Math.min(100, Math.max(0, allocatedPercent));
  const clampedPaid = Math.min(100, Math.max(0, projectPaidPercent));

  return (
    <Card className="project-usage-card">
      <div className="project-usage-header">
        <h3>{t("projects.budgetAllocation")}</h3>
        {isOverspent ? (
          <span className="project-overspent-badge" role="status">
            {t("projects.overspent")} {formatCurrency(Math.abs(availableBudget), currency, locale)}
          </span>
        ) : null}
      </div>

      <div className="project-usage-bars">
        <div className="project-usage-bar-item">
          <div className="project-usage-bar-meta">
            <span>
              {t("projects.allocated")} ({allocatedPercent.toFixed(1)}%)
            </span>
            <span>
              {formatCurrency(totalExpenseBudget, currency, locale)} /{" "}
              {formatCurrency(projectBudget, currency, locale)}
            </span>
          </div>
          <div className="budget-progress-track">
            <div
              className={`budget-progress-fill ${isOverspent ? "expense-percentage-fill-high" : ""}`}
              style={{ width: `${clampedAllocated}%` }}
            />
          </div>
        </div>

        <div className="project-usage-bar-item">
          <div className="project-usage-bar-meta">
            <span>
              {t("projects.budgetVsPaid")} ({projectPaidPercent.toFixed(1)}%)
            </span>
            <span>
              {formatCurrency(totalPaid, currency, locale)} /{" "}
              {formatCurrency(projectBudget, currency, locale)}
            </span>
          </div>
          <div className="budget-progress-track">
            <div
              className="budget-progress-fill"
              style={{ width: `${clampedPaid}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
