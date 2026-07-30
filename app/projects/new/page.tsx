import Link from "next/link";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { AppShell } from "@/components/layout/app-shell";

type NewProjectPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell description="Add a new project to track spending." title="New project">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ProjectCreateForm />
      <p className="category-footer-link">
        <Link className="auth-link" href="/projects">
          Back to projects
        </Link>
      </p>
    </AppShell>
  );
}
