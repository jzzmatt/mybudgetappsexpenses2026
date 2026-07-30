import Link from "next/link";
import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { AppShell } from "@/components/layout/app-shell";

type NewCategoryPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell description="Add a new spending category." title="New category">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <CategoryCreateForm />
      <p className="category-footer-link">
        <Link className="auth-link" href="/categories">
          Back to categories
        </Link>
      </p>
    </AppShell>
  );
}
