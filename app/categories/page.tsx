import { CategoryList } from "@/components/categories/category-list";
import { CategoryToolbar } from "@/components/categories/category-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { getCategories } from "@/lib/categories/queries";
import { getTranslations } from "@/lib/i18n/server";
import type { Category } from "@/lib/categories/types";

type CategoriesPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const { q } = await searchParams;
  const { t } = await getTranslations();

  let categories: Category[] = [];
  let loadError: string | undefined;

  try {
    categories = await getCategories(q);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("categories.loadError");
  }

  return (
    <AppShell
      actions={<PageActionButton href="/categories/new">{t("categories.add")}</PageActionButton>}
      description={t("categories.description")}
      title={t("categories.title")}
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        <CategoryToolbar search={q} />
        <CategoryList categories={categories} search={q} />
      </ListPageContent>
    </AppShell>
  );
}
