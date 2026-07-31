import * as XLSX from "xlsx";
import type { ReportData } from "@/lib/reports/types";

export function buildReportExcel(report: ReportData) {
  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: "Report", Value: report.title },
    { Metric: "Period", Value: report.period_label },
    { Metric: "Currency", Value: report.currency },
    { Metric: "Total budget", Value: report.summary.total_budget },
    { Metric: "Total paid", Value: report.summary.total_paid },
    { Metric: "Remaining", Value: report.summary.remaining },
    { Metric: "Utilization %", Value: Number(report.summary.utilization_percent.toFixed(1)) },
  ]);

  const rowsSheet = XLSX.utils.json_to_sheet(
    report.rows.map((row) => ({
      Label: row.label,
      Budget: row.budget,
      Paid: row.paid,
      Remaining: row.remaining,
      "Utilization %": Number(row.utilization_percent.toFixed(1)),
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, rowsSheet, "Report");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
