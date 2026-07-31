import Link from "next/link";
import type { BudgetFilters } from "@/lib/budgets/types";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";

type BudgetFiltersFormProps = {
  filters: BudgetFilters;
  categories: Category[];
  projects: Project[];
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export function BudgetFiltersForm({ filters, categories, projects }: BudgetFiltersFormProps) {
  return (
    <form action="/budgets" className="expense-filters-form" method="get">
      {filters.search ? <input name="q" type="hidden" value={filters.search} /> : null}

      <label className="auth-field expense-filter-field" htmlFor="budget-filter-category">
        <span>Category</span>
        <select defaultValue={filters.categoryId ?? ""} id="budget-filter-category" name="category">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="budget-filter-project">
        <span>Project</span>
        <select defaultValue={filters.projectId ?? ""} id="budget-filter-project" name="project">
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="budget-filter-currency">
        <span>Currency</span>
        <select defaultValue={filters.currency ?? ""} id="budget-filter-currency" name="currency">
          <option value="">All currencies</option>
          {EXPENSE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="budget-filter-year">
        <span>Year</span>
        <select defaultValue={filters.year ?? ""} id="budget-filter-year" name="year">
          <option value="">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="budget-filter-month">
        <span>Month</span>
        <select defaultValue={filters.month ?? ""} id="budget-filter-month" name="month">
          <option value="">All months</option>
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

      <div className="expense-filter-actions">
        <button className="button button-outline button-small" type="submit">
          Apply filters
        </button>
        {filters.categoryId ||
        filters.projectId ||
        filters.currency ||
        filters.year ||
        filters.month ? (
          <Link className="auth-link" href="/budgets">
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
