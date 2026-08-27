import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateCategoryAction } from "@/lib/categories/actions";
import { getTranslations } from "@/lib/i18n/server";
import type { Category } from "@/lib/categories/types";

type CategoryEditFormProps = {
  category: Category;
};

export async function CategoryEditForm({ category }: CategoryEditFormProps) {
  const { t } = await getTranslations();
  const updateCategory = updateCategoryAction.bind(null, category.id);

  return (
    <Card className="category-form-card">
      <form action={updateCategory} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={category.name}
          id="category-name"
          label={t("categories.name")}
          name="name"
          placeholder="e.g. Technology"
          required
        />
        <label className="auth-field" htmlFor="category-description">
          <span>{t("projects.descriptionLabel")}</span>
          <textarea
            defaultValue={category.description ?? ""}
            id="category-description"
            name="description"
            placeholder={t("common.optional")}
            rows={4}
          />
        </label>
        <div className="category-form-actions">
          <Button type="submit">{t("common.save")}</Button>
          <Link className="auth-link" href="/categories">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </Card>
  );
}
