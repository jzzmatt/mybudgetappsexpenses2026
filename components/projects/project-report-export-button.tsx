"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { generateProjectReportPdf } from "@/lib/projects/export-pdf";
import type { ProjectReportData } from "@/lib/projects/types";

type ProjectReportExportButtonProps = {
  reportData: ProjectReportData;
};

export function ProjectReportExportButton({ reportData }: ProjectReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useTranslations();

  const handleExport = () => {
    setIsExporting(true);
    try {
      const pdfBytes = generateProjectReportPdf(reportData);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeProjectName = reportData.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `project-report-${safeProjectName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      window.alert(t("errors.generic"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      className="button-small"
      disabled={isExporting}
      onClick={handleExport}
      type="button"
    >
      {isExporting ? t("projects.exporting") : t("projects.exportReport")}
    </Button>
  );
}
