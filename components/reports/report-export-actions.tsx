import Link from "next/link";
import { buildReportExportQueryString } from "@/lib/reports/params";
import type { ReportFilters } from "@/lib/reports/types";

type ReportExportActionsProps = {
  filters: ReportFilters;
};

export function ReportExportActions({ filters }: ReportExportActionsProps) {
  const query = buildReportExportQueryString(filters);
  const pdfHref = `/api/reports/pdf?${query}`;
  const excelHref = `/api/reports/excel?${query}`;

  return (
    <div className="report-export-actions">
      <Link className="button button-outline button-small" href={pdfHref}>
        Export PDF
      </Link>
      <Link className="button button-outline button-small" href={excelHref}>
        Export Excel
      </Link>
    </div>
  );
}
