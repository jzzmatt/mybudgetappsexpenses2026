import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { DashboardProjectBudget } from "@/lib/dashboard/types";

type DashboardBudgetByProjectProps = {
  currency: ExpenseCurrency;
  projects: DashboardProjectBudget[];
};

export function DashboardBudgetByProject({ currency, projects }: DashboardBudgetByProjectProps) {
  return (
    <Card className="dashboard-table-card">
      <div className="dashboard-table-header">
        <h2>Budget by Project</h2>
      </div>
      {projects.length === 0 ? (
        <p className="dashboard-table-empty">No project budgets recorded for this period.</p>
      ) : (
        <div className="category-table-wrap">
          <table className="category-table dashboard-table">
            <caption className="sr-only">Budget by project</caption>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Budget</th>
                <th scope="col">Paid</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.project}>
                  <td>{project.project}</td>
                  <td>{formatCurrency(project.budget, currency)}</td>
                  <td>{formatCurrency(project.paid, currency)}</td>
                  <td className="budget-progress-cell">
                    <BudgetProgressBar percent={project.progress} />
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
