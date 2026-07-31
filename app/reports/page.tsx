import Link from "next/link";
import { ListPageContent } from "@/components/layout/list-page-content";
import { AppShell } from "@/components/layout/app-shell";
import { ReportsBudgetVsPaidChart } from "@/components/reports/reports-budget-vs-paid-chart";
import { ReportsConsumptionList } from "@/components/reports/reports-consumption-list";
import { ReportsMonthlyChart } from "@/components/reports/reports-monthly-chart";
import { ReportsPeriodControls } from "@/components/reports/reports-period-controls";
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards";
import { getDashboardData } from "@/lib/dashboard/queries";
import { parseReportPeriod } from "@/lib/reports/params";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const period = parseReportPeriod(params);

  let loadError: string | undefined;
  let reportData;

  try {
    reportData = await getDashboardData(period);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load reports. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell actions={<ReportsPeriodControls period={period} />} title="Reports">
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {reportData ? (
        <ListPageContent>
          <ReportsSummaryCards currency={reportData.currency} kpis={reportData.kpis} />
          <div className="reports-content-row">
            <ReportsBudgetVsPaidChart
              currency={reportData.currency}
              data={reportData.categoryData}
            />
            <ReportsConsumptionList categories={reportData.categoryData} />
          </div>
          <ReportsMonthlyChart
            currency={reportData.currency}
            data={reportData.monthlyData}
            year={reportData.year}
          />
          <p className="reports-ai-link">
            Need narrative insights?{" "}
            <Link className="auth-link" href="/ai-report">
              Generate an AI executive report
            </Link>
          </p>
        </ListPageContent>
      ) : null}
    </AppShell>
  );
}
