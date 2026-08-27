import {
  EXPENSE_PAGE_SIZE,
  EXPENSE_SORT_FIELDS,
  EXPENSE_STATUSES,
  PROJECT_EXPENSE_DEFAULT_ORDER,
  PROJECT_EXPENSE_DEFAULT_SORT,
  type ExpenseFilters,
  type ExpenseSortField,
  type ExpenseStatus,
} from "@/lib/expenses/types";
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

function parseSortField(value: string | undefined): ExpenseSortField | undefined {
  if (!value) {
    return undefined;
  }

  return EXPENSE_SORT_FIELDS.includes(value as ExpenseSortField)
    ? (value as ExpenseSortField)
    : undefined;
}

function parseStatus(value: string | undefined): ExpenseStatus | undefined {
  if (!value) {
    return undefined;
  }

  return EXPENSE_STATUSES.includes(value as ExpenseStatus) ? (value as ExpenseStatus) : undefined;
}

export function parseExpenseSearchParams(params: RawSearchParams): ExpenseFilters {
  const month = parsePositiveInt(getParam(params, "month"));
  const year = parsePositiveInt(getParam(params, "year"));
  const order = getParam(params, "order");

  const currencyParam = getParam(params, "currency");

  return {
    search: getParam(params, "q")?.trim() || undefined,
    categoryId: getParam(params, "category") || undefined,
    projectId: getParam(params, "project") || undefined,
    vendorId: getParam(params, "vendor") || undefined,
    status: parseStatus(getParam(params, "status")),
    currency: isExpenseCurrency(currencyParam) ? currencyParam : undefined,
    year: year && year >= 2000 && year <= 2100 ? year : undefined,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    sort: parseSortField(getParam(params, "sort")),
    order: order === "asc" || order === "desc" ? order : undefined,
    page: parsePositiveInt(getParam(params, "page")),
  };
}

export function buildExpenseQueryString(
  filters: ExpenseFilters,
  options?: { omitProjectId?: boolean },
): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.categoryId) {
    params.set("category", filters.categoryId);
  }

  if (filters.projectId && !options?.omitProjectId) {
    params.set("project", filters.projectId);
  }

  if (filters.vendorId) {
    params.set("vendor", filters.vendorId);
  }

  if (filters.status) {
    params.set("status", filters.status);
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

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.order) {
    params.set("order", filters.order);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getExpensePageSize() {
  return EXPENSE_PAGE_SIZE;
}

export function getProjectExpenseFilters(
  projectId: string,
  params: RawSearchParams,
): ExpenseFilters {
  const parsed = parseExpenseSearchParams(params);

  return {
    ...parsed,
    projectId,
    sort: parsed.sort ?? PROJECT_EXPENSE_DEFAULT_SORT,
    order: parsed.order ?? PROJECT_EXPENSE_DEFAULT_ORDER,
  };
}

export function countProjectExpenseActiveFilters(filters: ExpenseFilters): number {
  let count = 0;

  if (filters.categoryId) {
    count += 1;
  }

  if (filters.vendorId) {
    count += 1;
  }

  if (
    filters.sort !== PROJECT_EXPENSE_DEFAULT_SORT ||
    filters.order !== PROJECT_EXPENSE_DEFAULT_ORDER
  ) {
    count += 1;
  }

  return count;
}

export function hasProjectNonDefaultSort(filters: ExpenseFilters): boolean {
  return (
    filters.sort !== PROJECT_EXPENSE_DEFAULT_SORT ||
    filters.order !== PROJECT_EXPENSE_DEFAULT_ORDER
  );
}

export type ProjectExpenseSortPreset = "recent" | "budget_high" | "budget_low";

export function getProjectExpenseSortPreset(filters: ExpenseFilters): ProjectExpenseSortPreset {
  if (filters.sort === "budget_amount" && filters.order === "asc") {
    return "budget_low";
  }

  if (filters.sort === "budget_amount") {
    return "budget_high";
  }

  return "recent";
}

export function getProjectExpenseSortLabel(filters: ExpenseFilters): string {
  const preset = getProjectExpenseSortPreset(filters);

  if (preset === "budget_high") {
    return "Highest value";
  }

  if (preset === "budget_low") {
    return "Lowest value";
  }

  return "Most recent";
}

export function projectExpenseSortPresetToFilters(
  preset: ProjectExpenseSortPreset,
): Pick<ExpenseFilters, "sort" | "order"> {
  switch (preset) {
    case "budget_high":
      return { sort: "budget_amount", order: "desc" };
    case "budget_low":
      return { sort: "budget_amount", order: "asc" };
    default:
      return { sort: PROJECT_EXPENSE_DEFAULT_SORT, order: PROJECT_EXPENSE_DEFAULT_ORDER };
  }
}
