import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";

type ProjectsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { q } = await searchParams;

  let projects: Project[] = [];
  let loadError: string | undefined;

  try {
    projects = await getProjects(q);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load projects. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell
      actions={<PageActionButton href="/projects/new">Add project</PageActionButton>}
      description="Select a project financial workspace or create a new one."
      title="My Projects"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        <ProjectToolbar search={q} />
        <ProjectList projects={projects} search={q} />
      </ListPageContent>
    </AppShell>
  );
}
