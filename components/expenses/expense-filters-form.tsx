import Link from "next/link";
import { EXPENSE_STATUSES } from "@/lib/expenses/types";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
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

export async function ExpenseFiltersForm({
  filters,
  categories,
  projects,
  vendors,
}: ExpenseFiltersFormProps) {
  const { t, locale } = await getTranslations();
  const intlLocale = getIntlLocale(locale);
  const clearHref = "/expenses";

  return (
    <form action="/expenses" className="list-filters-form" method="get">
      {filters.search ? <input name="q" type="hidden" value={filters.search} /> : null}
      {filters.sort ? <input name="sort" type="hidden" value={filters.sort} /> : null}
      {filters.order ? <input name="order" type="hidden" value={filters.order} /> : null}

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-category">
        <span>{t("expenses.category")}</span>
        <select defaultValue={filters.categoryId ?? ""} id="expense-filter-category" name="category">
          <option value="">{t("expenses.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-project">
        <span>{t("expenses.project")}</span>
        <select defaultValue={filters.projectId ?? ""} id="expense-filter-project" name="project">
          <option value="">{t("nav.projects")}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-vendor">
        <span>{t("expenses.vendor")}</span>
        <select defaultValue={filters.vendorId ?? ""} id="expense-filter-vendor" name="vendor">
          <option value="">{t("expenses.allVendors")}</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-status">
        <span>{t("expenses.status")}</span>
        <select defaultValue={filters.status ?? ""} id="expense-filter-status" name="status">
          <option value="">{t("expenses.allStatuses")}</option>
          {EXPENSE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {translateEnum(t, "status", status)}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-currency">
        <span>{t("projects.currency")}</span>
        <select defaultValue={filters.currency ?? ""} id="expense-filter-currency" name="currency">
          <option value="">{t("expenses.allCurrencies")}</option>
          {EXPENSE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-year">
        <span>{t("expenses.allYears").replace("All ", "")}</span>
        <select defaultValue={filters.year ?? ""} id="expense-filter-year" name="year">
          <option value="">{t("expenses.allYears")}</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field expense-filter-field" htmlFor="expense-filter-month">
        <span>{t("expenses.allMonths").replace("All ", "")}</span>
        <select defaultValue={filters.month ?? ""} id="expense-filter-month" name="month">
          <option value="">{t("expenses.allMonths")}</option>
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const label = new Date(2026, index, 1).toLocaleDateString(intlLocale, { month: "long" });
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
          {t("common.applyFilters")}
        </button>
        {filters.categoryId ||
        filters.projectId ||
        filters.vendorId ||
        filters.status ||
        filters.currency ||
        filters.year ||
        filters.month ? (
          <Link className="auth-link" href={clearHref}>
            {t("expenses.clearFilters")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
