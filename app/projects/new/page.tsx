import { AppShell } from "@/components/layout/app-shell";
import { ProjectCreateForm } from "@/components/projects/project-create-form";

type NewProjectPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell title="New project">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ProjectCreateForm />
    </AppShell>
  );
}
