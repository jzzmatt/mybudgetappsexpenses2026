import { AiCfoChat } from "@/components/ai-cfo/ai-cfo-chat";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslations } from "@/lib/i18n/server";
import { getProjects } from "@/lib/projects/queries";

export default async function AiCfoPage() {
  const { t } = await getTranslations();
  let projects: { id: string; name: string; description: string | null }[] = [];

  try {
    const records = await getProjects();
    projects = records.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
    }));
  } catch {
    projects = [];
  }

  return (
    <AppShell description={t("aiCfo.description")} title={t("aiCfo.title")}>
      <h2 className="sr-only" id="ai-cfo-heading">
        {t("aiCfo.title")}
      </h2>
      <AiCfoChat projects={projects} />
    </AppShell>
  );
}
