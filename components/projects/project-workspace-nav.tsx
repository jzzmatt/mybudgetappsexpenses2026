"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ProjectWorkspaceNavProps = {
  projectId: string;
  projectName: string;
  activeTab?: "overview" | "expenses" | "reports" | "ai-report";
};

export function ProjectWorkspaceNav({
  projectId,
  activeTab,
}: ProjectWorkspaceNavProps) {
  const pathname = usePathname();

  const isOverview =
    activeTab === "overview" ||
    pathname === `/projects/${projectId}` ||
    pathname === `/projects/${projectId}/`;

  const isExpenses =
    activeTab === "expenses" ||
    pathname.startsWith(`/projects/${projectId}/expenses`);

  const isReports =
    activeTab === "reports" ||
    pathname.startsWith(`/projects/${projectId}/reports`);

  const isAiReport =
    activeTab === "ai-report" ||
    pathname.startsWith(`/projects/${projectId}/ai-report`);

  return (
    <nav aria-label="Project Workspace Navigation" className="project-workspace-nav">
      <Link
        aria-current={isOverview ? "page" : undefined}
        className={`project-workspace-tab${isOverview ? " project-workspace-tab-active" : ""}`}
        href={`/projects/${projectId}`}
      >
        Overview
      </Link>
      <Link
        aria-current={isExpenses ? "page" : undefined}
        className={`project-workspace-tab${isExpenses ? " project-workspace-tab-active" : ""}`}
        href={`/projects/${projectId}/expenses`}
      >
        Expenses
      </Link>
      <Link
        aria-current={isReports ? "page" : undefined}
        className={`project-workspace-tab${isReports ? " project-workspace-tab-active" : ""}`}
        href={`/projects/${projectId}/reports`}
      >
        Reports
      </Link>
      <Link
        aria-current={isAiReport ? "page" : undefined}
        className={`project-workspace-tab${isAiReport ? " project-workspace-tab-active" : ""}`}
        href={`/ai-report`}
      >
        AI Report
      </Link>
    </nav>
  );
}
