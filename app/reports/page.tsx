import Link from "next/link";
import { ReportControlsForm } from "@/components/reports/report-controls-form";
import { ReportExportActions } from "@/components/reports/report-export-actions";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { ReportTable } from "@/components/reports/report-table";
import { AppShell } from "@/components/layout/app-shell";
import { parseReportFilters } from "@/lib/reports/params";
import { getReportData } from "@/lib/reports/queries";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const filters = parseReportFilters(params);

  let loadError: string | undefined;
  let report;

  try {
    report = await getReportData(filters);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load report data. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell
      actions={<ReportControlsForm filters={filters} />}
      description={
        report
          ? `${report.title} for ${report.period_label} (${report.currency}).`
          : "Generate monthly, yearly, category, and project reports."
      }
      title="Reports"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {report ? (
        <>
          <ReportSummaryCards report={report} />
          <div className="report-actions-row">
            <ReportExportActions filters={filters} />
          </div>
          <ReportTable report={report} />
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
