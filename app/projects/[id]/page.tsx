import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { ProjectOverviewKpis } from "@/components/projects/project-overview-kpis";
import { ProjectRecentExpensesCard } from "@/components/projects/project-recent-expenses-card";
import { ProjectUsageAllocationCard } from "@/components/projects/project-usage-allocation-card";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { formatCurrency } from "@/lib/currency/format";
import { getTranslations } from "@/lib/i18n/server";
import { getProjectOverview } from "@/lib/projects/queries";

type ProjectOverviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectOverviewPage({ params }: ProjectOverviewPageProps) {
  const { id } = await params;
  const { t, locale } = await getTranslations();
  const data = await getProjectOverview(id);

  if (!data) {
    notFound();
  }

  const { project, financials, categoryData, monthlyData, recentExpenses } = data;
  const currentYear = new Date().getFullYear();

  return (
    <AppShell
      actions={
        <div className="project-workspace-header-actions">
          <PageActionButton href={`/projects/${project.id}/edit`}>
            {t("projects.editProject")}
          </PageActionButton>
          <PageActionButton href={`/expenses/new?project=${project.id}`}>
            {t("common.addExpense")}
          </PageActionButton>
        </div>
      }
      description={`${t("projects.projectBudget")}: ${formatCurrency(
        project.budget_amount,
        project.currency,
        locale,
      )}`}
      title={project.name}
    >
      <ListPageContent>
        <div className="project-workspace-topbar">
          <Link className="auth-link" href="/projects">
            {t("nav.backToProjects")}
          </Link>
          <ProjectWorkspaceNav activeTab="overview" projectId={project.id} projectName={project.name} />
        </div>

        <ProjectOverviewKpis financials={financials} />

        <ProjectUsageAllocationCard financials={financials} />

        <DashboardChartsSection
          categoryData={categoryData}
          currency={project.currency}
          monthlyData={monthlyData}
          year={currentYear}
        />

        <ProjectRecentExpensesCard
          currency={project.currency}
          expenses={recentExpenses}
          projectId={project.id}
        />
      </ListPageContent>
    </AppShell>
  );
}
