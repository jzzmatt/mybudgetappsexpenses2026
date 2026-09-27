import { AiCfoChat } from "@/components/ai-cfo/ai-cfo-chat";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslations } from "@/lib/i18n/server";

export default async function AiCfoPage() {
  const { t } = await getTranslations();

  return (
    <AppShell description={t("aiCfo.description")} title={t("aiCfo.title")}>
      <h2 className="sr-only" id="ai-cfo-heading">
        {t("aiCfo.title")}
      </h2>
      <AiCfoChat />
    </AppShell>
  );
}
