"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildAiReportPdf } from "@/lib/ai-report/export-pdf";
import type { AiReportResult } from "@/lib/ai-report/types";

type AiReportExportButtonProps = {
  report: AiReportResult;
};

export function AiReportExportButton({ report }: AiReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const onExport = () => {
    setIsExporting(true);
    try {
      const pdfBytes = buildAiReportPdf(report);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeProjectName = (report.project_name || "project")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      link.download = `ai-report-${safeProjectName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export AI Report PDF:", err);
      window.alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button className="button-small" disabled={isExporting} onClick={onExport} type="button">
      {isExporting ? "Exporting PDF…" : "Export AI PDF Report"}
    </Button>
  );
}
