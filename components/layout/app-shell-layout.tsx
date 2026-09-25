"use client";

import type { ReactNode } from "react";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppMobileSignOut } from "@/components/layout/app-mobile-sign-out";
import { AppSidebarToggle } from "@/components/layout/app-sidebar-toggle";
import { SidebarVisibilityProvider, useSidebarVisibility } from "@/components/layout/sidebar-visibility";

type AppShellLayoutProps = {
  skipToContentLabel: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  sidebar: ReactNode;
  showMobileSignOut: boolean;
  children: ReactNode;
};

function AppShellLayoutFrame({
  skipToContentLabel,
  title,
  description,
  actions,
  sidebar,
  showMobileSignOut,
  children,
}: AppShellLayoutProps) {
  const { hidden } = useSidebarVisibility();
  const shellClassName = `app-shell${hidden ? " app-shell-sidebar-hidden" : ""}`;

  return (
    <div className={shellClassName}>
      <a className="skip-link" href="#main-content">
        {skipToContentLabel}
      </a>
      {sidebar}
      <div className="app-main">
        <header className="app-header">
          <div className="app-header-copy">
            <div className="app-header-title-row">
              <AppSidebarToggle variant="expand" />
              <h1>{title}</h1>
            </div>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="app-header-actions">
            <LanguageSelector />
            {actions}
            {showMobileSignOut ? <AppMobileSignOut /> : null}
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

export function AppShellLayout(props: AppShellLayoutProps) {
  return (
    <SidebarVisibilityProvider>
      <AppShellLayoutFrame {...props} />
    </SidebarVisibilityProvider>
  );
}
