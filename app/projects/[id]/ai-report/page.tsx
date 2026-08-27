import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { AiReportExportButton } from "@/components/ai-report/ai-report-export-button";
import { AiReportView } from "@/components/ai-report/ai-report-view";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { buildProjectAiReportContext } from "@/lib/ai-report/context";
import { generateProjectAiReport } from "@/lib/ai-report/generate";
import { getTranslations } from "@/lib/i18n/server";
import { getProjectById } from "@/lib/projects/queries";
import type { AiReportResult } from "@/lib/ai-report/types";

type ProjectAiReportPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generate?: string }>;
};

export default async function ProjectAiReportPage({ params, searchParams }: ProjectAiReportPageProps) {
  const { id } = await params;
  const { generate } = await searchParams;
  const shouldGenerate = generate === "true";
  const { t } = await getTranslations();

  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }

  let loadError: string | undefined;
  let report: AiReportResult | undefined;

  if (shouldGenerate) {
    try {
      const context = await buildProjectAiReportContext(id);
      if (!context) {
        throw new Error(t("aiReport.loadError"));
      }
      report = await generateProjectAiReport(context);
    } catch (error) {
      loadError = error instanceof Error ? error.message : t("aiReport.loadError");
    }
  }

  return (
    <AppShell
      actions={
        report ? (
          <AiReportExportButton report={report} />
        ) : (
          <Link className="button button-small" href={`/projects/${project.id}/ai-report?generate=true`}>
            {t("aiReport.generate")}
          </Link>
        )
      }
      description={t("aiReport.description")}
      title={`${project.name} ${t("aiReport.title")}`}
    >
      <ListPageContent>
        <div className="project-workspace-topbar">
          <Link className="auth-link" href="/projects">
            {t("nav.backToProjects")}
          </Link>
          <ProjectWorkspaceNav activeTab="ai-report" projectId={project.id} projectName={project.name} />
        </div>

        {loadError ? (
          <p className="form-error page-error" role="alert">
            {loadError}
          </p>
        ) : null}

        {!shouldGenerate && !loadError ? (
          <div className="ai-report-placeholder">
            <p>{t("aiReport.emptyState")}</p>
          </div>
        ) : null}

        {report ? <AiReportView report={report} /> : null}
      </ListPageContent>
    </AppShell>
  );
}
