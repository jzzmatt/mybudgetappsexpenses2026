import { ExpenseFiltersForm } from "@/components/expenses/expense-filters-form";
import { ExpenseSearchForm } from "@/components/expenses/expense-search-form";
import { PasteExpenseButton } from "@/components/expenses/paste-expense-button";
import { ListToolbarCard } from "@/components/layout/list-toolbar-card";
import type { Category } from "@/lib/categories/types";
import type { ExpenseFilters } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseToolbarProps = {
  filters: ExpenseFilters;
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
};

export function ExpenseToolbar({ filters, categories, projects, vendors }: ExpenseToolbarProps) {
  const hasActiveFilters = Boolean(
    filters.categoryId ||
      filters.projectId ||
      filters.vendorId ||
      filters.status ||
      filters.currency ||
      filters.year ||
      filters.month,
  );

  return (
    <div className="expense-toolbar">
      <ListToolbarCard>
        <ExpenseSearchForm filters={filters} />
        <PasteExpenseButton />
      </ListToolbarCard>
      <details className="list-filters-panel" open={hasActiveFilters}>
        <summary className="list-filters-trigger">Filters</summary>
        <ListToolbarCard>
          <ExpenseFiltersForm
            categories={categories}
            filters={filters}
            projects={projects}
            vendors={vendors}
          />
        </ListToolbarCard>
      </details>
    </div>
  );
}
