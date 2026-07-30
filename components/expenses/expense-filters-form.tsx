import Link from "next/link";
import { EXPENSE_STATUSES } from "@/lib/expenses/types";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import type { Category } from "@/lib/categories/types";
import type { ExpenseFilters } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseFiltersFormProps = {
  filters: ExpenseFilters;
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export function ExpenseFiltersForm({
  filters,
  categories,
  projects,
  vendors,
}: ExpenseFiltersFormProps) {
  const clearHref = "/expenses";

  return (
    <form action="/expenses" className="expense-filters-form" method="get">
      {filters.search ? <input name="q" type="hidden" value={filters.search} /> : null}
      {filters.sort ? <input name="sort" type="hidden" value={filters.sort} /> : null}
      {filters.order ? <input name="order" type="hidden" value={filters.order} /> : null}

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-category">
        <span>Category</span>
        <select defaultValue={filters.categoryId ?? ""} id="expense-filter-category" name="category">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-project">
        <span>Project</span>
        <select defaultValue={filters.projectId ?? ""} id="expense-filter-project" name="project">
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-vendor">
        <span>Vendor</span>
        <select defaultValue={filters.vendorId ?? ""} id="expense-filter-vendor" name="vendor">
          <option value="">All vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-status">
        <span>Status</span>
        <select defaultValue={filters.status ?? ""} id="expense-filter-status" name="status">
          <option value="">All statuses</option>
          {EXPENSE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-currency">
        <span>Currency</span>
        <select defaultValue={filters.currency ?? ""} id="expense-filter-currency" name="currency">
          <option value="">All currencies</option>
          {EXPENSE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-year">
        <span>Year</span>
        <select defaultValue={filters.year ?? ""} id="expense-filter-year" name="year">
          <option value="">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-month">
        <span>Month</span>
        <select defaultValue={filters.month ?? ""} id="expense-filter-month" name="month">
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
        filters.vendorId ||
        filters.status ||
        filters.currency ||
        filters.year ||
        filters.month ? (
          <Link className="auth-link" href={clearHref}>
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
