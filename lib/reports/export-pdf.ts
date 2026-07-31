import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency/format";
import type { ReportData } from "@/lib/reports/types";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function buildReportPdf(report: ReportData) {
  const doc = new jsPDF();
  const currency = report.currency;

  doc.setFontSize(18);
  doc.text(report.title, 14, 20);
  doc.setFontSize(11);
  doc.text(`Period: ${report.period_label}`, 14, 28);
  doc.text(`Currency: ${currency}`, 14, 34);

  doc.setFontSize(12);
  doc.text("Summary", 14, 46);
  doc.setFontSize(10);
  doc.text(`Total budget: ${formatCurrency(report.summary.total_budget, currency)}`, 14, 54);
  doc.text(`Total paid: ${formatCurrency(report.summary.total_paid, currency)}`, 14, 60);
  doc.text(`Remaining: ${formatCurrency(report.summary.remaining, currency)}`, 14, 66);
  doc.text(`Utilization: ${formatPercent(report.summary.utilization_percent)}`, 14, 72);

  autoTable(doc, {
    startY: 80,
    head: [["Label", "Budget", "Paid", "Remaining", "Utilization"]],
    body: report.rows.map((row) => [
      row.label,
      formatCurrency(row.budget, currency),
      formatCurrency(row.paid, currency),
      formatCurrency(row.remaining, currency),
      formatPercent(row.utilization_percent),
    ]),
  });

  return Buffer.from(doc.output("arraybuffer"));
}
