import type { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/projects", label: "Projects" },
  { href: "/vendors", label: "Vendors" },
  { href: "/expenses", label: "Expenses" },
  { href: "/budgets", label: "Budgets" },
  { href: "/reports", label: "Reports" },
];

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, description, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <p className="app-sidebar-brand">MY Expense Tracker</p>
        <nav className="app-sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link className="app-sidebar-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="app-header-actions">{actions}</div> : null}
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
