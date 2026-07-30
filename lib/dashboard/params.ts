import type { DashboardPeriod } from "@/lib/dashboard/types";

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

export function parseDashboardPeriod(params: RawSearchParams): DashboardPeriod {
  const now = new Date();
  const year = parsePositiveInt(getParam(params, "year")) ?? now.getFullYear();
  const monthParam = getParam(params, "month");

  let month: number | null;

  if (monthParam === "all") {
    month = null;
  } else if (monthParam) {
    const parsed = parsePositiveInt(monthParam);
    month = parsed && parsed >= 1 && parsed <= 12 ? parsed : now.getMonth() + 1;
  } else {
    month = now.getMonth() + 1;
  }

  return {
    year: year >= 2000 && year <= 2100 ? year : now.getFullYear(),
    month,
  };
}

export function buildDashboardQueryString(period: DashboardPeriod): string {
  const params = new URLSearchParams();
  params.set("year", String(period.year));

  if (period.month === null) {
    params.set("month", "all");
  } else {
    params.set("month", String(period.month));
  }

  return `?${params.toString()}`;
}
