import { BudgetFiltersForm } from "@/components/budgets/budget-filters-form";
import { BudgetSearchForm } from "@/components/budgets/budget-search-form";
import { ListToolbarCard } from "@/components/layout/list-toolbar-card";
import type { BudgetFilters } from "@/lib/budgets/types";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";

type BudgetToolbarProps = {
  filters: BudgetFilters;
  categories: Category[];
  projects: Project[];
};

export function BudgetToolbar({ filters, categories, projects }: BudgetToolbarProps) {
  const hiddenFields: Record<string, string> = {};

  if (filters.categoryId) hiddenFields.category = filters.categoryId;
  if (filters.projectId) hiddenFields.project = filters.projectId;
  if (filters.currency) hiddenFields.currency = filters.currency;
  if (filters.year) hiddenFields.year = String(filters.year);
  if (filters.month) hiddenFields.month = String(filters.month);

  const hasActiveFilters = Boolean(
    filters.categoryId || filters.projectId || filters.currency || filters.year || filters.month,
  );

  return (
    <div className="expense-toolbar">
      <ListToolbarCard>
        <BudgetSearchForm
          defaultValue={filters.search}
          hiddenFields={Object.keys(hiddenFields).length ? hiddenFields : undefined}
        />
      </ListToolbarCard>
      <details className="list-filters-panel" open={hasActiveFilters}>
        <summary className="list-filters-trigger">Filters</summary>
        <ListToolbarCard>
          <BudgetFiltersForm categories={categories} filters={filters} projects={projects} />
        </ListToolbarCard>
      </details>
    </div>
  );
}
