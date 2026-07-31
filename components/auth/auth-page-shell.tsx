import type { ReactNode } from "react";
import { BudgetAppLogo } from "@/components/auth/budget-app-logo";
import { LoginBrandingPanel } from "@/components/auth/login-branding-panel";
import { Card } from "@/components/ui/card";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <main className="login-page">
      <LoginBrandingPanel />

      <section className="login-form-panel">
        <BudgetAppLogo className="login-mobile-logo" />

        <Card className="login-card">
          <BudgetAppLogo className="login-card-logo" />
          <h1>{title}</h1>
          <p className="login-description">{description}</p>
          {children}
        </Card>
      </section>
    </main>
  );
}
