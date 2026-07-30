import Link from "next/link";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryToolbar } from "@/components/categories/category-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { getCategories } from "@/lib/categories/queries";

type CategoriesPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const { q } = await searchParams;
  const categories = await getCategories(q);

  return (
    <AppShell
      description="Organize expenses and budgets by category."
      title="Categories"
    >
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
