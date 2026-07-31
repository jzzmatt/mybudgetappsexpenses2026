import type { ExpenseCurrency } from "@/lib/currency/types";

export const REPORT_TYPES = ["monthly", "yearly", "category", "project"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportFilters = {
  type: ReportType;
  year: number;
  month: number | null;
  currency: ExpenseCurrency;
};

export type ReportRow = {
  label: string;
  budget: number;
  paid: number;
  remaining: number;
  utilization_percent: number;
};

export type ReportSummary = {
  total_budget: number;
  total_paid: number;
  remaining: number;
  utilization_percent: number;
};

export type ReportData = {
  type: ReportType;
  title: string;
  period_label: string;
  currency: ExpenseCurrency;
  summary: ReportSummary;
  rows: ReportRow[];
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  category: "By category",
  project: "By project",
};
