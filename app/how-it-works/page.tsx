import { AppShell } from "@/components/layout/app-shell";
import { HowItWorksContent } from "@/components/how-it-works/how-it-works-content";
import { getTranslations } from "@/lib/i18n/server";

export default async function HowItWorksPage() {
  const { t } = await getTranslations();

  return (
    <AppShell description={t("nav.howItWorks")} title={t("landing.title")}>
      <HowItWorksContent />
    </AppShell>
  );
}
