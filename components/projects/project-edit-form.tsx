import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import { updateProjectAction } from "@/lib/projects/actions";
import type { Project } from "@/lib/projects/types";

type ProjectEditFormProps = {
  project: Project;
};

export async function ProjectEditForm({ project }: ProjectEditFormProps) {
  const { t } = await getTranslations();
  const updateProject = updateProjectAction.bind(null, project.id);

  return (
    <Card className="category-form-card">
      <form action={updateProject} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={project.name}
          id="project-name"
          label={t("projects.name")}
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
        <AuthField
          defaultValue={String(project.budget_amount ?? 0)}
          id="project-budget"
          inputMode="decimal"
          label={t("projects.projectBudget")}
          min="0"
          name="budget_amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <label className="auth-field" htmlFor="project-currency">
          <span>{t("projects.currency")}</span>
          <select defaultValue={project.currency} id="project-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="project-description">
          <span>{t("projects.descriptionLabel")}</span>
          <textarea
            defaultValue={project.description ?? ""}
            id="project-description"
            name="description"
            placeholder={t("common.optional")}
            rows={4}
          />
        </label>
        <label className="auth-field" htmlFor="project-status">
          <span>{t("projects.statusLabel")}</span>
          <select defaultValue={project.status} id="project-status" name="status" required>
            <option value="active">{translateEnum(t, "status", "active")}</option>
            <option value="paused">{translateEnum(t, "status", "paused")}</option>
            <option value="completed">{translateEnum(t, "status", "completed")}</option>
          </select>
        </label>
        <div className="category-form-actions">
          <Button type="submit">{t("common.save")}</Button>
          <Link className="auth-link" href="/projects">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </Card>
  );
}
