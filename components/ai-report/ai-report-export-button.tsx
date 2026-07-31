"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AiReportResult } from "@/lib/ai-report/types";

type AiReportExportButtonProps = {
  report: AiReportResult;
};

export function AiReportExportButton({ report }: AiReportExportButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onExport = () => {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch("/api/ai-report/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(report),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Unable to export PDF.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "executive-ai-report.pdf";
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (exportError) {
        setError(exportError instanceof Error ? exportError.message : "Unable to export PDF.");
      }
    });
  };

  return (
    <div className="ai-report-export">
      <Button className="button-outline button-small" disabled={isPending} onClick={onExport} type="button">
        {isPending ? "Exporting…" : "Export PDF"}
      </Button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
