import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type ListToolbarCardProps = {
  children: ReactNode;
};

export function ListToolbarCard({ children }: ListToolbarCardProps) {
  return <Card className="list-toolbar-card">{children}</Card>;
}
