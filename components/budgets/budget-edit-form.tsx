import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { updateBudgetAction } from "@/lib/budgets/actions";
import type { BudgetWithUsage } from "@/lib/budgets/types";
import { formatCurrency } from "@/lib/currency/format";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";

type BudgetEditFormProps = {
  budget: BudgetWithUsage;
  categories: Category[];
  projects: Project[];
};

export function BudgetEditForm({ budget, categories, projects }: BudgetEditFormProps) {
  const updateBudget = updateBudgetAction.bind(null, budget.id);

  return (
    <Card className="category-form-card expense-form-card">
      <div className="budget-usage-summary">
        <p>
          <strong>Paid:</strong> {formatCurrency(budget.paid_amount, budget.currency)}
        </p>
        <p>
          <strong>Remaining:</strong> {formatCurrency(budget.remaining, budget.currency)}
        </p>
        <BudgetProgressBar percent={budget.progress_percent} />
      </div>
      <form action={updateBudget} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={budget.name}
          id="budget-name"
          label="Name"
          name="name"
          placeholder="e.g. Alpha Platform Technology Budget"
          required
        />
        <AuthField
          defaultValue={String(budget.amount)}
          id="budget-amount"
          inputMode="decimal"
          label="Budget amount"
          min="0"
          name="amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <label className="auth-field" htmlFor="budget-currency">
          <span>Currency</span>
          <select defaultValue={budget.currency} id="budget-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <AuthField
          defaultValue={String(budget.year)}
          id="budget-year"
          label="Year"
          max="2100"
          min="2000"
          name="year"
          required
          type="number"
        />
        <label className="auth-field" htmlFor="budget-month">
          <span>Month</span>
          <select
            defaultValue={budget.month === null ? "" : String(budget.month)}
            id="budget-month"
            name="month"
          >
            <option value="">Full year</option>
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;
              const label = new Date(2026, index, 1).toLocaleDateString("en-US", { month: "long" });
              return (
                <option key={month} value={month}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
        <label className="auth-field" htmlFor="budget-category">
          <span>Category</span>
          <select
            defaultValue={budget.category_id ?? ""}
            id="budget-category"
            name="category_id"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="budget-project">
          <span>Project</span>
          <select defaultValue={budget.project_id ?? ""} id="budget-project" name="project_id">
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <div className="category-form-actions">
          <Button type="submit">Save changes</Button>
          <Link className="auth-link" href="/budgets">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
