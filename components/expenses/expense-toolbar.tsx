import Link from "next/link";
import { ExpenseFiltersForm } from "@/components/expenses/expense-filters-form";
import { ExpenseSearchForm } from "@/components/expenses/expense-search-form";
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
  return (
    <div className="expense-toolbar">
      <div className="category-toolbar">
        <ExpenseSearchForm filters={filters} />
        <Link className="button button-small" href="/expenses/new">
          New expense
        </Link>
      </div>
      <ExpenseFiltersForm
        categories={categories}
        filters={filters}
        projects={projects}
        vendors={vendors}
      />
    </div>
  );
}
