import { ExpenseFiltersForm } from "@/components/expenses/expense-filters-form";
import { ExpenseSearchForm } from "@/components/expenses/expense-search-form";
import { ListToolbarCard } from "@/components/layout/list-toolbar-card";
import { getTranslations } from "@/lib/i18n/server";
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

export async function ExpenseToolbar({ filters, categories, projects, vendors }: ExpenseToolbarProps) {
  const { t } = await getTranslations();

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
      </ListToolbarCard>
      <details className="list-filters-panel" open={hasActiveFilters}>
        <summary className="list-filters-trigger">{t("expenses.filters")}</summary>
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
