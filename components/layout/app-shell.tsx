import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppMobileSignOut } from "@/components/layout/app-mobile-sign-out";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { AppSidebarUser } from "@/components/layout/app-sidebar-user";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <p className="app-sidebar-brand">MY Expense Tracker</p>
          <AppSidebarNav />
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
