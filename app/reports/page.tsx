import Link from "next/link";
import { ListPageContent } from "@/components/layout/list-page-content";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { getTranslations } from "@/lib/i18n/server";
import { getProjects } from "@/lib/projects/queries";
import type { Project } from "@/lib/projects/types";

export default async function ReportsPage() {
  const { t, locale } = await getTranslations();

  let projects: Project[] = [];
  let loadError: string | undefined;

  try {
    projects = await getProjects();
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("projects.loadError");
  }

  return (
    <AppShell description={t("reports.description")} title={t("reports.title")}>
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        {projects.length === 0 ? (
          <Card className="list-empty-card">
            <h2>{t("common.noResults")}</h2>
            <p>{t("projects.noProjects")}</p>
            <Link className="button button-small" href="/projects/new">
              {t("common.createProject")}
            </Link>
          </Card>
        ) : (
          <div className="list-mobile-cards">
            {projects.map((project) => (
              <Card className="list-mobile-card" key={project.id}>
                <div className="list-mobile-card-header">
                  <div>
                    <h3>{project.name}</h3>
                    <p className="list-mobile-card-date">
                      {t("projects.projectBudget")}:{" "}
                      {formatCurrency(project.budget_amount, project.currency, locale)}
                    </p>
                  </div>
                </div>
                <div className="list-mobile-card-actions">
                  <Link className="button button-small" href={`/projects/${project.id}/reports`}>
                    {t("reports.projectReport")}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ListPageContent>
    </AppShell>
  );
}
