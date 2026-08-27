import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslations } from "@/lib/i18n/server";

type NewCategoryPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  return (
    <AppShell title={t("categories.createTitle")}>
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <CategoryCreateForm />
    </AppShell>
  );
}
