import Link from "next/link";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell description="Track budgets and expenses by project." title="Projects">
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ProjectToolbar search={q} />
      <ProjectList projects={projects} search={q} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
