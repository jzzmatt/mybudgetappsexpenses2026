import Link from "next/link";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { DeleteBudgetButton } from "@/components/budgets/delete-budget-button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { BudgetWithUsage } from "@/lib/budgets/types";

type BudgetListProps = {
  budgets: BudgetWithUsage[];
  hasActiveFilters: boolean;
};

function formatPeriod(month: number | null, year: number) {
  if (month === null) {
    return String(year);
  }

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function BudgetList({ budgets, hasActiveFilters }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>No budgets found</h2>
        <p>
          {hasActiveFilters
            ? "No budgets match your current search or filters. Try adjusting them or create a new budget."
            : "Create your first budget to track spending limits and progress."}
        </p>
        <Link className="button button-small" href="/budgets/new">
          Create budget
        </Link>
      </Card>
    );
  }

  return (
    <>
      <section aria-label="Budget consumption" className="budget-consumption-section list-mobile-cards">
        <div className="budget-section-header">
          <h2>Budget Consumption</h2>
        </div>
        {budgets.map((budget) => (
          <Card className="list-mobile-card budget-consumption-card" key={budget.id}>
            <div className="list-mobile-card-header">
              <div>
                <h3>{budget.name}</h3>
                <p className="list-mobile-card-date">
                  {formatPeriod(budget.month, budget.year)}
                  {budget.category?.name ? ` · ${budget.category.name}` : ""}
                </p>
              </div>
              <span className="budget-consumption-percent">{budget.progress_percent.toFixed(0)}%</span>
            </div>
            <BudgetProgressBar percent={budget.progress_percent} />
            <dl className="list-mobile-card-details">
              <div>
                <dt>Budget</dt>
                <dd>{formatCurrency(budget.amount, budget.currency)}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>{formatCurrency(budget.paid_amount, budget.currency)}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{formatCurrency(budget.remaining, budget.currency)}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>{budget.project?.name ?? "—"}</dd>
              </div>
            </dl>
            <div className="list-mobile-card-actions">
              <Link className="auth-link" href={`/budgets/${budget.id}/edit`}>
                Edit
              </Link>
              <DeleteBudgetButton budgetId={budget.id} budgetName={budget.name} />
            </div>
          </Card>
        ))}
      </section>

      <Card className="category-table-card list-desktop-table budget-table-card">
        <div className="budget-section-header budget-section-header-table">
          <h2>All Budgets</h2>
        </div>
        <div className="category-table-wrap">
          <table className="category-table list-table budget-table">
            <caption className="sr-only">Budgets</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Period</th>
                <th scope="col">Category</th>
                <th scope="col">Project</th>
                <th scope="col">Budget</th>
                <th scope="col">Paid</th>
                <th scope="col">Remaining</th>
                <th scope="col">Progress</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget.id}>
                  <td>{budget.name}</td>
                  <td>{formatPeriod(budget.month, budget.year)}</td>
                  <td>{budget.category?.name ?? "—"}</td>
                  <td>{budget.project?.name ?? "—"}</td>
                  <td>{formatCurrency(budget.amount, budget.currency)}</td>
                  <td>{formatCurrency(budget.paid_amount, budget.currency)}</td>
                  <td>{formatCurrency(budget.remaining, budget.currency)}</td>
                  <td className="budget-progress-cell">
                    <BudgetProgressBar percent={budget.progress_percent} />
                  </td>
                  <td className="category-table-actions">
                    <Link className="auth-link" href={`/budgets/${budget.id}/edit`}>
                      Edit
                    </Link>
                    <DeleteBudgetButton budgetId={budget.id} budgetName={budget.name} />
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
