import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBudgetAction } from "@/lib/budgets/actions";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";

type BudgetCreateFormProps = {
  categories: Category[];
  projects: Project[];
};

export function BudgetCreateForm({ categories, projects }: BudgetCreateFormProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <Card className="category-form-card expense-form-card">
      <form action={createBudgetAction} className="category-form">
        <AuthField
          autoComplete="off"
          id="budget-name"
          label="Name"
          name="name"
          placeholder="e.g. Alpha Platform Technology Budget"
          required
        />
        <AuthField
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
          <select defaultValue={DEFAULT_EXPENSE_CURRENCY} id="budget-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <AuthField
          defaultValue={String(currentYear)}
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
          <select defaultValue={String(currentMonth)} id="budget-month" name="month">
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
          <select id="budget-category" name="category_id">
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
          <select id="budget-project" name="project_id">
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <div className="category-form-actions">
          <Button type="submit">Create budget</Button>
          <Link className="auth-link" href="/budgets">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
