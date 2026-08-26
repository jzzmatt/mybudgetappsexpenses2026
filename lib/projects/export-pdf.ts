import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency/format";
import type { ProjectReportData } from "@/lib/projects/types";

interface AutoTableDoc extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export function generateProjectReportPdf(reportData: ProjectReportData): Uint8Array {
  const doc = new jsPDF() as AutoTableDoc;
  const { project, financials, categoryAnalysis, vendorAnalysis, expenses, generatedAt } = reportData;
  const currency = project.currency;

  let y = 18;

  // Title & Header
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Project Financial Report: ${project.name}`, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date(generatedAt).toLocaleString("en-US")} | Currency: ${currency}`, 14, y);
  y += 10;

  // Financial Summary Box
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Financial Summary", 14, y);
  y += 4;

  const summaryData = [
    ["Project Budget", formatCurrency(financials.projectBudget, currency)],
    ["Total Expense Budget", formatCurrency(financials.totalExpenseBudget, currency)],
    ["Total Paid Out", formatCurrency(financials.totalPaid, currency)],
    ["Total Remaining", formatCurrency(financials.totalExpenseRemaining, currency)],
    ["Available Budget", formatCurrency(financials.availableBudget, currency)],
    ["Budget Allocated", `${financials.allocatedPercent.toFixed(1)}%`],
    ["Budget Consumed", `${financials.projectPaidPercent.toFixed(1)}%`],
    ["Total Expenses Count", `${financials.expenseCount}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [0, 99, 177] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;

  // Category Breakdown
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Category Breakdown", 14, y);
  y += 4;

  const categoryTableData = categoryAnalysis.map((c) => [
    c.category,
    `${c.expenseCount}`,
    formatCurrency(c.budget, currency),
    formatCurrency(c.paid, currency),
    formatCurrency(c.remaining, currency),
    `${c.percentOfBudget.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Category", "Count", "Budget", "Paid", "Remaining", "% of Allocation"]],
    body: categoryTableData.length > 0 ? categoryTableData : [["No categories recorded", "-", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [0, 99, 177] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;

  // Vendor Breakdown
  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Vendor Breakdown", 14, y);
  y += 4;

  const vendorTableData = vendorAnalysis.map((v) => [
    v.vendor,
    `${v.expenseCount}`,
    formatCurrency(v.budget, currency),
    formatCurrency(v.paid, currency),
    formatCurrency(v.remaining, currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Vendor", "Count", "Budget", "Paid", "Remaining"]],
    body: vendorTableData.length > 0 ? vendorTableData : [["No vendors recorded", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [0, 99, 177] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;

  // Expense Line Items
  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Expense Records", 14, y);
  y += 4;

  const expenseTableData = expenses.map((e) => [
    e.date,
    e.description,
    e.category?.name || "—",
    e.vendor?.name || "—",
    formatCurrency(e.budget_amount, currency),
    formatCurrency(e.paid_amount, currency),
    e.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Category", "Vendor", "Budget", "Paid", "Status"]],
    body: expenseTableData.length > 0 ? expenseTableData : [["No expenses recorded", "-", "-", "-", "-", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [0, 99, 177] },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  return new Uint8Array(doc.output("arraybuffer"));
}
