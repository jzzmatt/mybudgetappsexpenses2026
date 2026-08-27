"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  buildExpenseQueryString,
  countProjectExpenseActiveFilters,
  getProjectExpenseSortLabel,
  getProjectExpenseSortPreset,
  hasProjectNonDefaultSort,
  projectExpenseSortPresetToFilters,
  type ProjectExpenseSortPreset,
} from "@/lib/expenses/params";
import type { ExpenseFilters } from "@/lib/expenses/types";
import type { Category } from "@/lib/categories/types";
import type { Vendor } from "@/lib/vendors/types";

type ProjectExpenseToolbarProps = {
  basePath: string;
  filters: ExpenseFilters;
  categories: Category[];
  vendors: Vendor[];
};

function navigateToFilters(
  router: ReturnType<typeof useRouter>,
  basePath: string,
  filters: ExpenseFilters,
) {
  const href = `${basePath}${buildExpenseQueryString(
    { ...filters, page: undefined },
    { omitProjectId: true },
  )}`;
  router.push(href);
}

export function ProjectExpenseToolbar({
  basePath,
  filters,
  categories,
  vendors,
}: ProjectExpenseToolbarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sheetCategory, setSheetCategory] = useState(filters.categoryId ?? "");
  const [sheetVendor, setSheetVendor] = useState(filters.vendorId ?? "");
  const [sheetSort, setSheetSort] = useState<ProjectExpenseSortPreset>(
    getProjectExpenseSortPreset(filters),
  );

  const activeFilterCount = countProjectExpenseActiveFilters(filters);
  const sortPreset = getProjectExpenseSortPreset(filters);
  const sortLabel = getProjectExpenseSortLabel(filters);

  const categoryLabel = useMemo(
    () => categories.find((category) => category.id === filters.categoryId)?.name,
    [categories, filters.categoryId],
  );
  const vendorLabel = useMemo(
    () => vendors.find((vendor) => vendor.id === filters.vendorId)?.name,
    [vendors, filters.vendorId],
  );

  const openFilterSheet = () => {
    setSheetCategory(filters.categoryId ?? "");
    setSheetVendor(filters.vendorId ?? "");
    setSheetSort(getProjectExpenseSortPreset(filters));
    setIsFilterSheetOpen(true);
  };

  useEffect(() => {
    const trimmed = searchValue.trim();
    const current = filters.search?.trim() ?? "";

    if (trimmed === current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      navigateToFilters(router, basePath, {
        ...filters,
        search: trimmed || undefined,
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [basePath, filters, router, searchValue]);

  const clearHref = `${basePath}${buildExpenseQueryString(
    {
      projectId: filters.projectId,
      sort: undefined,
      order: undefined,
    },
    { omitProjectId: true },
  )}`;

  const hasRemovableFilters = Boolean(
    filters.search || filters.categoryId || filters.vendorId || activeFilterCount > 0,
  );

  const onDesktopCategoryChange = (categoryId: string) => {
    navigateToFilters(router, basePath, {
      ...filters,
      categoryId: categoryId || undefined,
    });
  };

  const onDesktopVendorChange = (vendorId: string) => {
    navigateToFilters(router, basePath, {
      ...filters,
      vendorId: vendorId || undefined,
    });
  };

  const onDesktopSortChange = (preset: ProjectExpenseSortPreset) => {
    const sortFilters = projectExpenseSortPresetToFilters(preset);
    navigateToFilters(router, basePath, {
      ...filters,
      ...sortFilters,
    });
  };

  const applySheetFilters = () => {
    const sortFilters = projectExpenseSortPresetToFilters(sheetSort);
    navigateToFilters(router, basePath, {
      ...filters,
      categoryId: sheetCategory || undefined,
      vendorId: sheetVendor || undefined,
      ...sortFilters,
    });
    setIsFilterSheetOpen(false);
  };

  const clearSheetFilters = () => {
    setSheetCategory("");
    setSheetVendor("");
    setSheetSort("recent");
    router.push(clearHref);
    setIsFilterSheetOpen(false);
  };

  return (
    <section aria-label="Expense search and filters" className="project-expense-toolbar">
      <div className="project-expense-search-row">
        <label className="sr-only" htmlFor="project-expense-search">
          Search expenses
        </label>
        <input
          className="project-expense-search-input"
          id="project-expense-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search expenses..."
          type="search"
          value={searchValue}
        />
        <button
          className="button button-outline button-small project-expense-filters-mobile-trigger"
          onClick={openFilterSheet}
          type="button"
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <div className="project-expense-filters-desktop">
        <label className="project-expense-filter-field">
          <span className="sr-only">Category</span>
          <select
            aria-label="Filter by category"
            onChange={(event) => onDesktopCategoryChange(event.target.value)}
            value={filters.categoryId ?? ""}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="project-expense-filter-field">
          <span className="sr-only">Vendor</span>
          <select
            aria-label="Filter by vendor"
            onChange={(event) => onDesktopVendorChange(event.target.value)}
            value={filters.vendorId ?? ""}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>

        <label className="project-expense-filter-field">
          <span className="sr-only">Sort expenses</span>
          <select
            aria-label="Sort expenses"
            onChange={(event) =>
              onDesktopSortChange(event.target.value as ProjectExpenseSortPreset)
            }
            value={sortPreset}
          >
            <option value="recent">Most Recent</option>
            <option value="budget_high">Highest value</option>
            <option value="budget_low">Lowest value</option>
          </select>
        </label>
      </div>

      {hasRemovableFilters ? (
        <div className="project-expense-active-filters">
          {categoryLabel ? (
            <span className="project-expense-active-filter-chip">Category: {categoryLabel}</span>
          ) : null}
          {vendorLabel ? (
            <span className="project-expense-active-filter-chip">Vendor: {vendorLabel}</span>
          ) : null}
          {hasProjectNonDefaultSort(filters) ? (
            <span className="project-expense-active-filter-chip">Sort: {sortLabel}</span>
          ) : null}
          {filters.search ? (
            <span className="project-expense-active-filter-chip">Search: {filters.search}</span>
          ) : null}
          <Link className="project-expense-clear-filters" href={clearHref}>
            Clear filters
          </Link>
        </div>
      ) : null}

      {isFilterSheetOpen ? (
        <div className="project-expense-filter-sheet-overlay" role="presentation">
          <div
            aria-label="Expense filters"
            aria-modal="true"
            className="project-expense-filter-sheet"
            role="dialog"
          >
            <div className="project-expense-filter-sheet-header">
              <h3>Filters</h3>
              <button
                aria-label="Close filters"
                className="project-expense-filter-sheet-close"
                onClick={() => setIsFilterSheetOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <label className="auth-field" htmlFor="project-expense-sheet-category">
              <span>Category</span>
              <select
                id="project-expense-sheet-category"
                onChange={(event) => setSheetCategory(event.target.value)}
                value={sheetCategory}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-field" htmlFor="project-expense-sheet-vendor">
              <span>Vendor</span>
              <select
                id="project-expense-sheet-vendor"
                onChange={(event) => setSheetVendor(event.target.value)}
                value={sheetVendor}
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="auth-field" htmlFor="project-expense-sheet-sort">
              <span>Sort</span>
              <select
                id="project-expense-sheet-sort"
                onChange={(event) =>
                  setSheetSort(event.target.value as ProjectExpenseSortPreset)
                }
                value={sheetSort}
              >
                <option value="recent">Most Recent</option>
                <option value="budget_high">Highest value</option>
                <option value="budget_low">Lowest value</option>
              </select>
            </label>

            <div className="project-expense-filter-sheet-actions">
              <button
                className="button button-outline"
                onClick={clearSheetFilters}
                type="button"
              >
                Clear
              </button>
              <button className="button" onClick={applySheetFilters} type="button">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
