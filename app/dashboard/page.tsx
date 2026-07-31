import { DashboardBudgetByProject } from "@/components/dashboard/dashboard-budget-by-project";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { DashboardRecentExpenses } from "@/components/dashboard/dashboard-recent-expenses";
import { DashboardPeriodForm } from "@/components/dashboard/dashboard-period-form";
import { AppShell } from "@/components/layout/app-shell";
import { parseDashboardPeriod } from "@/lib/dashboard/params";
import { getDashboardData } from "@/lib/dashboard/queries";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const period = parseDashboardPeriod(params);

  let loadError: string | undefined;
  let dashboardData;

  try {
    dashboardData = await getDashboardData(period);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load dashboard data. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell
      actions={<DashboardPeriodForm period={period} />}
      title="Dashboard"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {dashboardData ? (
        <div className="dashboard-page-content">
          <DashboardKpiCards
            currency={dashboardData.currency}
            kpiTrends={dashboardData.kpiTrends}
            kpis={dashboardData.kpis}
          />
          <DashboardChartsSection
            categoryData={dashboardData.categoryData}
            currency={dashboardData.currency}
            monthlyData={dashboardData.monthlyData}
            year={dashboardData.year}
          />
          <div className="dashboard-tables-row">
            <DashboardRecentExpenses
              currency={dashboardData.currency}
              expenses={dashboardData.recentExpenses}
            />
            <DashboardBudgetByProject
              currency={dashboardData.currency}
              projects={dashboardData.projectBudgets}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
