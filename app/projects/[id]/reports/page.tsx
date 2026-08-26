import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { ProjectOverviewKpis } from "@/components/projects/project-overview-kpis";
import { ProjectReportExportButton } from "@/components/projects/project-report-export-button";
import { ProjectReportTables } from "@/components/projects/project-report-tables";
import { ProjectUsageAllocationCard } from "@/components/projects/project-usage-allocation-card";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { DashboardChartsSection } from "@/components/dashboard/dashboard-charts-section";
import { getProjectReportData } from "@/lib/projects/queries";

type ProjectReportsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectReportsPage({ params }: ProjectReportsPageProps) {
  const { id } = await params;
  const reportData = await getProjectReportData(id);

  if (!reportData) {
    notFound();
  }

  const { project, financials, categoryAnalysis, vendorAnalysis, categoryChartData, monthlyChartData } =
    reportData;
  const currentYear = new Date().getFullYear();

  return (
    <AppShell
      actions={<ProjectReportExportButton reportData={reportData} />}
      description={`Comprehensive financial statement and breakdowns for ${project.name}.`}
      title={`${project.name} Reports`}
    >
      <ListPageContent>
        <div className="project-workspace-topbar">
          <Link className="auth-link" href="/projects">
            ← Back to My Projects
          </Link>
          <ProjectWorkspaceNav activeTab="reports" projectId={project.id} projectName={project.name} />
        </div>

        <ProjectOverviewKpis financials={financials} />

        <ProjectUsageAllocationCard financials={financials} />

        <ProjectReportTables
          categoryAnalysis={categoryAnalysis}
          currency={project.currency}
          vendorAnalysis={vendorAnalysis}
        />

        <DashboardChartsSection
          categoryData={categoryChartData}
          currency={project.currency}
          monthlyData={monthlyChartData}
          year={currentYear}
        />

        <p className="reports-ai-link">
          Looking for AI-driven insights?{" "}
          <Link className="auth-link" href={`/ai-report`}>
            Generate AI Report
          </Link>
        </p>
      </ListPageContent>
    </AppShell>
  );
}
