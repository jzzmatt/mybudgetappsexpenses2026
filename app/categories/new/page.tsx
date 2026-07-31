import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { AppShell } from "@/components/layout/app-shell";

type NewCategoryPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell title="New category">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <CategoryCreateForm />
    </AppShell>
  );
}
