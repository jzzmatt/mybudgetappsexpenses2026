import type { ReactNode } from "react";
import { BudgetAppLogo } from "@/components/auth/budget-app-logo";
import { LoginBrandingPanel } from "@/components/auth/login-branding-panel";
import { Card } from "@/components/ui/card";

type LoginShellProps = {
  children: ReactNode;
};

export function LoginShell({ children }: LoginShellProps) {
  return (
    <main className="login-page">
      <LoginBrandingPanel />

      <section className="login-form-panel">
        <BudgetAppLogo className="login-mobile-logo" />

        <Card className="login-card">
          <BudgetAppLogo className="login-card-logo" />
          <h1>Sign in to your account</h1>
          <p className="login-description">Welcome back! Please enter your details.</p>
          {children}
        </Card>
      </section>
    </main>
  );
}
