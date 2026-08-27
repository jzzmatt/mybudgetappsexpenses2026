import { AppShell } from "@/components/layout/app-shell";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { getTranslations } from "@/lib/i18n/server";

type NewProjectPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  return (
    <AppShell title={t("projects.createTitle")}>
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <ProjectCreateForm />
    </AppShell>
  );
}
