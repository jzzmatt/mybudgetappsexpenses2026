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

  const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return label;
}

export function BudgetList({ budgets, hasActiveFilters }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No budgets found</h2>
        <p>
          {hasActiveFilters
            ? "No budgets match your current search or filters. Try adjusting them or create a new budget."
            : "Create your first budget to track spending limits and progress."}
        </p>
        <Link className="auth-link" href="/budgets/new">
          Create budget
        </Link>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table budget-table">
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
  );
}
