import { LanguageSelector } from "@/components/i18n/language-selector";
import { AppSidebarFrame } from "@/components/layout/app-sidebar-frame";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { AppSidebarToggle } from "@/components/layout/app-sidebar-toggle";
import { AppSidebarUser } from "@/components/layout/app-sidebar-user";
import { getTranslations } from "@/lib/i18n/server";

export async function AppSidebar() {
  const { t } = await getTranslations();

  return (
    <AppSidebarFrame>
      <div className="app-sidebar-top">
        <div className="app-sidebar-head">
          <p className="app-sidebar-brand">{t("app.name")}</p>
          <AppSidebarToggle variant="collapse" />
        </div>
        <AppSidebarNav />
      </div>
      <div className="app-sidebar-locale">
        <LanguageSelector />
      </div>
      <AppSidebarUser />
    </AppSidebarFrame>
  );
}
