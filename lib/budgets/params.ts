import type { BudgetFilters } from "@/lib/budgets/types";
import { isExpenseCurrency } from "@/lib/currency/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseBudgetSearchParams(params: RawSearchParams): BudgetFilters {
  const month = parsePositiveInt(getParam(params, "month"));
  const year = parsePositiveInt(getParam(params, "year"));
  const currencyParam = getParam(params, "currency");

  return {
    search: getParam(params, "q")?.trim() || undefined,
    categoryId: getParam(params, "category") || undefined,
    projectId: getParam(params, "project") || undefined,
    currency: isExpenseCurrency(currencyParam) ? currencyParam : undefined,
    year: year && year >= 2000 && year <= 2100 ? year : undefined,
    month: month && month >= 1 && month <= 12 ? month : undefined,
  };
}

export function buildBudgetQueryString(filters: BudgetFilters): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.categoryId) {
    params.set("category", filters.categoryId);
  }

  if (filters.projectId) {
    params.set("project", filters.projectId);
  }

  if (filters.currency) {
    params.set("currency", filters.currency);
  }

  if (filters.year) {
    params.set("year", String(filters.year));
  }

  if (filters.month) {
    params.set("month", String(filters.month));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
