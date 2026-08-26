import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ProjectFinancialSummary } from "@/lib/projects/types";

type ProjectUsageAllocationCardProps = {
  financials: ProjectFinancialSummary;
};

export function ProjectUsageAllocationCard({ financials }: ProjectUsageAllocationCardProps) {
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
        <h3>Budget Allocation &amp; Consumption</h3>
        {isOverspent ? (
          <span className="project-overspent-badge" role="status">
            Overspent by {formatCurrency(Math.abs(availableBudget), currency)}
          </span>
        ) : null}
      </div>

      <div className="project-usage-bars">
        <div className="project-usage-bar-item">
          <div className="project-usage-bar-meta">
            <span>Budget Allocated ({allocatedPercent.toFixed(1)}%)</span>
            <span>
              {formatCurrency(totalExpenseBudget, currency)} of {formatCurrency(projectBudget, currency)}
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
            <span>Actual Paid Out ({projectPaidPercent.toFixed(1)}%)</span>
            <span>
              {formatCurrency(totalPaid, currency)} of {formatCurrency(projectBudget, currency)}
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
