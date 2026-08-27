import type { ReactNode } from "react";

type ListPageContentProps = {
  children: ReactNode;
  className?: string;
};

export function ListPageContent({ children, className }: ListPageContentProps) {
  return <div className={className ? `list-page-content ${className}` : "list-page-content"}>{children}</div>;
}
