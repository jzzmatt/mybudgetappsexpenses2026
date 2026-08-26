import { jsPDF } from "jspdf";
import type { AiReportResult } from "@/lib/ai-report/types";

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 6;
}

function addBulletSection(
  doc: jsPDF,
  title: string,
  items: string[],
  startY: number,
  maxWidth: number,
) {
  if (!items || items.length === 0) {
    return startY;
  }

  let y = startY;

  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  for (const item of items) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    y = addWrappedText(doc, `• ${item}`, 16, y, maxWidth - 2) + 4;
  }

  return y + 4;
}

export function buildAiReportPdf(report: AiReportResult): Uint8Array {
  const doc = new jsPDF();
  const maxWidth = 182;
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(report.title || "Project Executive AI Report", 14, y);
  y += 9;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  if (report.project_name) {
    y = addWrappedText(doc, `Project Workspace: ${report.project_name}`, 14, y, maxWidth) + 2;
  }
  y = addWrappedText(doc, `Currency: ${report.currency}`, 14, y, maxWidth) + 2;
  y = addWrappedText(
    doc,
    `Generated: ${new Date(report.generated_at).toLocaleString("en-US")}`,
    14,
    y,
    maxWidth,
  ) + 8;

  // Executive Summary
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Summary", 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  y = addWrappedText(doc, report.executive_summary, 14, y, maxWidth) + 8;

  // Spending Analysis
  if (report.spending_analysis) {
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Spending & Utilization Analysis", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(doc, report.spending_analysis, 14, y, maxWidth) + 8;
  }

  y = addBulletSection(doc, "Key Findings", report.key_findings, y, maxWidth);
  y = addBulletSection(doc, "Largest Budget Items", report.largest_items, y, maxWidth);
  y = addBulletSection(doc, "Pending & Partial Commitments", report.pending_items, y, maxWidth);
  y = addBulletSection(doc, "Strategic Recommendations", report.recommendations, y, maxWidth);
  y = addBulletSection(doc, "Risk Alerts", report.risk_alerts, y, maxWidth);

  return new Uint8Array(doc.output("arraybuffer"));
}
