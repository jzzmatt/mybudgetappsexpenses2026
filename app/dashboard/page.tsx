import { BudgetVsPaidChart } from "@/components/dashboard/budget-vs-paid-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { DashboardPeriodForm } from "@/components/dashboard/dashboard-period-form";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
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
      description={`Overview for ${dashboardData?.periodLabel ?? "selected period"}.`}
      title="Dashboard"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {dashboardData ? (
        <>
          <DashboardKpiCards kpis={dashboardData.kpis} />
          <div className="dashboard-charts-row">
            <BudgetVsPaidChart data={dashboardData.categoryData} />
            <CategoryChart data={dashboardData.categoryData} />
          </div>
          <MonthlyChart data={dashboardData.monthlyData} year={dashboardData.year} />
        </>
      ) : null}
    </AppShell>
  );
}
