import Link from "next/link";
import { ListPageContent } from "@/components/layout/list-page-content";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";

export default async function GlobalAiReportPage() {
  let projects: Project[] = [];
  let loadError: string | undefined;

  try {
    projects = await getProjects();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load projects. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell
      description="Select a project workspace to generate executive AI CFO summaries, spending analyses, and recommendations."
      title="Project AI Reports"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        {projects.length === 0 ? (
          <Card className="list-empty-card">
            <h2>No projects found</h2>
            <p>Create a project workspace first to generate AI executive reports.</p>
            <Link className="button button-small" href="/projects/new">
              Create project
            </Link>
          </Card>
        ) : (
          <div className="list-mobile-cards">
            {projects.map((project) => (
              <Card className="list-mobile-card" key={project.id}>
                <div className="list-mobile-card-header">
                  <div>
                    <h3>{project.name}</h3>
                    <p className="list-mobile-card-date">
                      Budget: {formatCurrency(project.budget_amount, project.currency)}
                    </p>
                  </div>
                </div>
                <div className="list-mobile-card-actions">
                  <Link className="button button-small" href={`/projects/${project.id}/ai-report`}>
                    Open Project AI Report
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ListPageContent>
    </AppShell>
  );
}
