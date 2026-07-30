import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <Card className="auth-card">
        <p className="auth-brand">BudgetApp</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </Card>
    </main>
  );
}
