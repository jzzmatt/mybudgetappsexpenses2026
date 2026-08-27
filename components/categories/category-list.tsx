import Link from "next/link";
import { DeleteCategoryButton } from "@/components/categories/delete-category-button";
import { Card } from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n/server";
import type { Category } from "@/lib/categories/types";

type CategoryListProps = {
  categories: Category[];
  search?: string;
};

export async function CategoryList({ categories, search }: CategoryListProps) {
  const { t } = await getTranslations();

  if (categories.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>{t("categories.noCategories")}</h2>
        <p>{search ? t("common.noResults") : t("categories.noCategories")}</p>
        <Link className="button button-small" href="/categories/new">
          {t("categories.add")}
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="list-mobile-cards">
        {categories.map((category) => (
          <Card className="list-mobile-card" key={category.id}>
            <div className="list-mobile-card-header">
              <h3>{category.name}</h3>
            </div>
            <p className="list-mobile-card-meta">
              {category.description || t("common.optional")}
            </p>
            <div className="list-mobile-card-actions">
              <Link className="auth-link" href={`/categories/${category.id}/edit`}>
                {t("common.edit")}
              </Link>
              <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="category-table-card list-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table">
            <caption className="sr-only">{t("categories.title")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("categories.name")}</th>
                <th scope="col">{t("projects.descriptionLabel")}</th>
                <th scope="col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || t("common.dash")}</td>
                  <td className="category-table-actions">
                    <Link className="auth-link" href={`/categories/${category.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                    <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
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
