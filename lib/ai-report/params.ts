import { DEFAULT_EXPENSE_CURRENCY, isExpenseCurrency } from "@/lib/currency/types";
import type { AiReportFilters } from "@/lib/ai-report/types";

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

export function parseAiReportFilters(params: RawSearchParams): AiReportFilters {
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
    year: year >= 2000 && year <= 2100 ? year : now.getFullYear(),
    month,
    currency: isExpenseCurrency(currencyParam) ? currencyParam : DEFAULT_EXPENSE_CURRENCY,
  };
}

export function buildAiReportQueryString(filters: AiReportFilters, generate = false): string {
  const searchParams = new URLSearchParams();
  searchParams.set("year", String(filters.year));
  searchParams.set("currency", filters.currency);

  if (filters.month !== null) {
    searchParams.set("month", String(filters.month));
  } else {
    searchParams.set("month", "all");
  }

  if (generate) {
    searchParams.set("generate", "true");
  }

  return `?${searchParams.toString()}`;
}

export function getAiReportPeriodLabel(filters: AiReportFilters) {
  if (filters.month === null) {
    return String(filters.year);
  }

  const date = new Date(filters.year, filters.month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function isGenerateRequested(params: RawSearchParams) {
  return getParam(params, "generate") === "true";
}
