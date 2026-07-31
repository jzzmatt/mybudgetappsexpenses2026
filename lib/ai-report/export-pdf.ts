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
  let y = startY;

  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text(title, 14, y);
  y += 8;
  doc.setFontSize(10);

  for (const item of items) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    y = addWrappedText(doc, `• ${item}`, 16, y, maxWidth - 2) + 4;
  }

  return y + 4;
}

export function buildAiReportPdf(report: AiReportResult) {
  const doc = new jsPDF();
  const maxWidth = 182;
  let y = 20;

  doc.setFontSize(18);
  doc.text(report.title, 14, y);
  y += 10;
  doc.setFontSize(11);
  y = addWrappedText(doc, `Period: ${report.period_label}`, 14, y, maxWidth) + 2;
  y = addWrappedText(doc, `Currency: ${report.currency}`, 14, y, maxWidth) + 2;
  y = addWrappedText(
    doc,
    `Generated: ${new Date(report.generated_at).toLocaleString("en-US")}`,
    14,
    y,
    maxWidth,
  ) + 8;

  doc.setFontSize(13);
  doc.text("Executive summary", 14, y);
  y += 8;
  doc.setFontSize(10);
  y = addWrappedText(doc, report.executive_summary, 14, y, maxWidth) + 8;

  y = addBulletSection(doc, "Key findings", report.key_findings, y, maxWidth);
  y = addBulletSection(doc, "Recommendations", report.recommendations, y, maxWidth);
  y = addBulletSection(doc, "Risk alerts", report.risk_alerts, y, maxWidth);

  return Buffer.from(doc.output("arraybuffer"));
}
