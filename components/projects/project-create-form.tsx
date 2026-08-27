import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import { createProjectAction } from "@/lib/projects/actions";

export async function ProjectCreateForm() {
  const { t } = await getTranslations();

  return (
    <ResourceFormLayout description={t("projects.createDescription")} title={t("projects.createTitle")}>
      <form action={createProjectAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="project-name"
          label={t("projects.name")}
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
        <AuthField
          defaultValue="0"
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
          <select defaultValue={DEFAULT_EXPENSE_CURRENCY} id="project-currency" name="currency" required>
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
            id="project-description"
            name="description"
            placeholder={t("common.optional")}
            rows={4}
          />
        </label>
        <label className="auth-field" htmlFor="project-status">
          <span>{t("projects.statusLabel")}</span>
          <select defaultValue="active" id="project-status" name="status" required>
            <option value="active">{translateEnum(t, "status", "active")}</option>
            <option value="paused">{translateEnum(t, "status", "paused")}</option>
            <option value="completed">{translateEnum(t, "status", "completed")}</option>
          </select>
        </label>
        <div className="resource-form-actions">
          <Button type="submit">{t("common.createProject")}</Button>
          <Link className="auth-link" href="/projects">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
