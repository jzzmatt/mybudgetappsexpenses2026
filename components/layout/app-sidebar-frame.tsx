"use client";

import type { ReactNode } from "react";
import { useSidebarVisibility } from "@/components/layout/sidebar-visibility";

type AppSidebarFrameProps = {
  children: ReactNode;
};

export function AppSidebarFrame({ children }: AppSidebarFrameProps) {
  const { hidden } = useSidebarVisibility();

  return (
    <aside
      aria-hidden={hidden ? true : undefined}
      className="app-sidebar"
      id="app-sidebar"
      inert={hidden ? true : undefined}
    >
      {children}
    </aside>
  );
}
