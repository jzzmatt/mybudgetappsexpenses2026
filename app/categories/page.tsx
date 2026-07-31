import Link from "next/link";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryToolbar } from "@/components/categories/category-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";
import type { Category } from "@/lib/categories/types";

type CategoriesPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const { q } = await searchParams;

  let categories: Category[] = [];
  let loadError: string | undefined;

  try {
    categories = await getCategories(q);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load categories. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell
      description="Organize expenses and budgets by category."
      title="Categories"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <CategoryToolbar search={q} />
      <CategoryList categories={categories} search={q} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
