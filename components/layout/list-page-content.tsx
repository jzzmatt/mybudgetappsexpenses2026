import type { ReactNode } from "react";

type ListPageContentProps = {
  children: ReactNode;
};

export function ListPageContent({ children }: ListPageContentProps) {
  return <div className="list-page-content">{children}</div>;
}
