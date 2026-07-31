import Link from "next/link";
import { AiReportControlsForm } from "@/components/ai-report/ai-report-controls-form";
import { AiReportExportButton } from "@/components/ai-report/ai-report-export-button";
import { AiReportView } from "@/components/ai-report/ai-report-view";
import { AppShell } from "@/components/layout/app-shell";
import { buildAiReportContext } from "@/lib/ai-report/context";
import { generateAiReport } from "@/lib/ai-report/generate";
import { isGenerateRequested, parseAiReportFilters } from "@/lib/ai-report/params";
import type { AiReportResult } from "@/lib/ai-report/types";

type AiReportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AiReportPage({ searchParams }: AiReportPageProps) {
  const params = await searchParams;
  const filters = parseAiReportFilters(params);
  const shouldGenerate = isGenerateRequested(params);

  let loadError: string | undefined;
  let report: AiReportResult | undefined;

  if (shouldGenerate) {
    try {
      const context = await buildAiReportContext(filters);
      report = await generateAiReport(filters, context);
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "Unable to generate AI report. Check your OpenAI and Supabase configuration.";
    }
  }

  return (
    <AppShell
      actions={<AiReportControlsForm filters={filters} />}
      description="Generate an executive AI report with recommendations for your selected period."
      title="AI Report"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {!shouldGenerate && !loadError ? (
        <p className="ai-report-placeholder">
          Select a period and currency, then click <strong>Generate AI report</strong> to create an
          executive summary with recommendations.
        </p>
      ) : null}
      {report ? (
        <>
          <div className="report-actions-row">
            <AiReportExportButton report={report} />
          </div>
          <AiReportView report={report} />
        </>
      ) : null}
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
