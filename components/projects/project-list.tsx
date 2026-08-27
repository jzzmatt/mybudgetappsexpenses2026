import Link from "next/link";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import type { Project } from "@/lib/projects/types";

type ProjectListProps = {
  projects: Project[];
  search?: string;
};

export async function ProjectList({ projects, search }: ProjectListProps) {
  const { t, locale } = await getTranslations();

  if (projects.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>{t("common.noResults")}</h2>
        <p>
          {search ? t("projects.noProjectsSearch") : t("projects.noProjects")}
        </p>
        <Link className="button button-small" href="/projects/new">
          {t("common.createProject")}
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="list-mobile-cards">
        {projects.map((project) => (
          <Card className="list-mobile-card" key={project.id}>
            <div className="list-mobile-card-header">
              <div>
                <h3>{project.name}</h3>
                <p className="list-mobile-card-date">
                  {t("projects.projectBudget")}:{" "}
                  {formatCurrency(project.budget_amount, project.currency as ExpenseCurrency, locale)}
                </p>
              </div>
              <span className={`status-badge status-${project.status}`}>
                {translateEnum(t, "status", project.status)}
              </span>
            </div>
            <p className="list-mobile-card-meta">
              {project.description || t("common.optional")}
            </p>
            <div className="list-mobile-card-actions">
              <Link className="button button-small" href={`/projects/${project.id}`}>
                {t("common.openProject")}
              </Link>
              <Link className="auth-link" href={`/projects/${project.id}/edit`}>
                {t("common.edit")}
              </Link>
              <DeleteProjectButton projectId={project.id} projectName={project.name} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="category-table-card list-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table">
            <caption className="sr-only">{t("nav.projects")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("projects.name")}</th>
                <th scope="col">{t("projects.projectBudget")}</th>
                <th scope="col">{t("projects.currency")}</th>
                <th scope="col">{t("projects.descriptionLabel")}</th>
                <th scope="col">{t("projects.statusLabel")}</th>
                <th scope="col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>
                      <Link className="auth-link" href={`/projects/${project.id}`}>
                        {project.name}
                      </Link>
                    </strong>
                  </td>
                  <td>
                    {formatCurrency(project.budget_amount, project.currency as ExpenseCurrency, locale)}
                  </td>
                  <td>{project.currency}</td>
                  <td>{project.description || t("common.dash")}</td>
                  <td>
                    <span className={`status-badge status-${project.status}`}>
                      {translateEnum(t, "status", project.status)}
                    </span>
                  </td>
                  <td className="category-table-actions">
                    <Link className="button button-small" href={`/projects/${project.id}`}>
                      {t("common.openProject")}
                    </Link>
                    <Link className="auth-link" href={`/projects/${project.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                    <DeleteProjectButton projectId={project.id} projectName={project.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
