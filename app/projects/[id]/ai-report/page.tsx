import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { AiReportExportButton } from "@/components/ai-report/ai-report-export-button";
import { AiReportView } from "@/components/ai-report/ai-report-view";
import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";
import { buildProjectAiReportContext } from "@/lib/ai-report/context";
import { generateProjectAiReport } from "@/lib/ai-report/generate";
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
        throw new Error("Unable to load project workspace context for AI reporting.");
      }
      report = await generateProjectAiReport(context);
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "Unable to generate AI report. Check your OpenAI API configuration.";
    }
  }

  return (
    <AppShell
      actions={
        report ? (
          <AiReportExportButton report={report} />
        ) : (
          <Link className="button button-small" href={`/projects/${project.id}/ai-report?generate=true`}>
            Generate AI Report
          </Link>
        )
      }
      description={`Executive AI CFO insights, spending analysis, and strategic recommendations for ${project.name}.`}
      title={`${project.name} AI Report`}
    >
      <ListPageContent>
        <div className="project-workspace-topbar">
          <Link className="auth-link" href="/projects">
            ← Back to My Projects
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
            <p>
              Click <strong>Generate AI Report</strong> above to generate an executive CFO analysis,
              utilization evaluation, largest commitment review, and actionable financial recommendations for{" "}
              <strong>{project.name}</strong>.
            </p>
          </div>
        ) : null}

        {report ? <AiReportView report={report} /> : null}
      </ListPageContent>
    </AppShell>
  );
}
