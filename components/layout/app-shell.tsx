import type { ReactNode } from "react";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";

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
        <p className="app-sidebar-brand">MY Expense Tracker</p>
        <AppSidebarNav />
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="app-header-actions">{actions}</div> : null}
        </header>
        <main className="app-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
