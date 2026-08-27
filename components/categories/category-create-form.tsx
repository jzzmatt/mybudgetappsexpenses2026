import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createCategoryAction } from "@/lib/categories/actions";
import { getTranslations } from "@/lib/i18n/server";

export async function CategoryCreateForm() {
  const { t } = await getTranslations();

  return (
    <ResourceFormLayout description={t("categories.description")} title={t("categories.createTitle")}>
      <form action={createCategoryAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="category-name"
          label={t("categories.name")}
          name="name"
          placeholder="e.g. Technology"
          required
        />
        <label className="auth-field" htmlFor="category-description">
          <span>{t("projects.descriptionLabel")}</span>
          <textarea
            id="category-description"
            name="description"
            placeholder={t("common.optional")}
            rows={4}
          />
        </label>
        <div className="resource-form-actions">
          <Button type="submit">{t("categories.add")}</Button>
          <Link className="auth-link" href="/categories">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
