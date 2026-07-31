import {
  EXPENSE_PAGE_SIZE,
  EXPENSE_SORT_FIELDS,
  EXPENSE_STATUSES,
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

export function buildExpenseQueryString(filters: ExpenseFilters): string {
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
