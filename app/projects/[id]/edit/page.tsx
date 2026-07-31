import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectEditForm } from "@/components/projects/project-edit-form";
import { AppShell } from "@/components/layout/app-shell";
import { getProjectById } from "@/lib/projects/queries";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditProjectPage({ params, searchParams }: EditProjectPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <AppShell description={`Update details for ${project.name}.`} title="Edit project">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ProjectEditForm project={project} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/projects">
          Back to projects
        </Link>
      </p>
    </AppShell>
  );
}
