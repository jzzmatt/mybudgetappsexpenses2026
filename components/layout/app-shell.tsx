import type { ReactNode } from "react";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppMobileSignOut } from "@/components/layout/app-mobile-sign-out";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { AppSidebarUser } from "@/components/layout/app-sidebar-user";
import { getTranslations } from "@/lib/i18n/server";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export async function AppShell({ title, description, actions, children }: AppShellProps) {
  const { t } = await getTranslations();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t("app.skipToContent")}
      </a>
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <p className="app-sidebar-brand">{t("app.name")}</p>
          <AppSidebarNav />
        </div>
        <div className="app-sidebar-locale">
          <LanguageSelector />
        </div>
        <AppSidebarUser />
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="app-header-copy">
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="app-header-actions">
            <LanguageSelector />
            {actions}
            <AppMobileSignOut />
          </div>
        </header>
        <main className="app-content" id="main-content">
          {children}
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
