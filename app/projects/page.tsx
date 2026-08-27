import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { getTranslations } from "@/lib/i18n/server";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";

type ProjectsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { q } = await searchParams;
  const { t } = await getTranslations();

  let projects: Project[] = [];
  let loadError: string | undefined;

  try {
    projects = await getProjects(q);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("projects.loadError");
  }

  return (
    <AppShell
      actions={<PageActionButton href="/projects/new">{t("common.addProject")}</PageActionButton>}
      description={t("projects.description")}
      title={t("projects.title")}
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
