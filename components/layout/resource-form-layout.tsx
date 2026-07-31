import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type ResourceFormLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ResourceFormLayout({ title, description, children }: ResourceFormLayoutProps) {
  return (
    <div className="resource-form-layout">
      <div className="resource-form-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Card className="resource-form-card">{children}</Card>
    </div>
  );
}
