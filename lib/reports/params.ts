import {
  DEFAULT_EXPENSE_CURRENCY,
  isExpenseCurrency,
  type ExpenseCurrency,
} from "@/lib/currency/types";
import { REPORT_TYPES, type ReportFilters, type ReportType } from "@/lib/reports/types";

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

function parseReportType(value: string | undefined): ReportType {
  if (value && REPORT_TYPES.includes(value as ReportType)) {
    return value as ReportType;
  }

  return "monthly";
}

export function parseReportFilters(params: RawSearchParams): ReportFilters {
  const now = new Date();
  const year = parsePositiveInt(getParam(params, "year")) ?? now.getFullYear();
  const monthParam = getParam(params, "month");
  const currencyParam = getParam(params, "currency");

  let month: number | null = null;

  if (monthParam && monthParam !== "all") {
    const parsed = parsePositiveInt(monthParam);
    month = parsed && parsed >= 1 && parsed <= 12 ? parsed : now.getMonth() + 1;
  }

  return {
    type: parseReportType(getParam(params, "type")),
    year: year >= 2000 && year <= 2100 ? year : now.getFullYear(),
    month,
    currency: isExpenseCurrency(currencyParam) ? currencyParam : DEFAULT_EXPENSE_CURRENCY,
  };
}

export function buildReportQueryString(filters: ReportFilters): string {
  const searchParams = new URLSearchParams();
  searchParams.set("type", filters.type);
  searchParams.set("year", String(filters.year));
  searchParams.set("currency", filters.currency);

  if (filters.month !== null) {
    searchParams.set("month", String(filters.month));
  } else {
    searchParams.set("month", "all");
  }

  return `?${searchParams.toString()}`;
}

export function buildReportExportQueryString(filters: ReportFilters): string {
  return buildReportQueryString(filters).slice(1);
}
