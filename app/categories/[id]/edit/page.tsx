import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryEditForm } from "@/components/categories/category-edit-form";
import { AppShell } from "@/components/layout/app-shell";
import { getCategoryById } from "@/lib/categories/queries";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditCategoryPage({ params, searchParams }: EditCategoryPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <AppShell description={`Update details for ${category.name}.`} title="Edit category">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <CategoryEditForm category={category} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/categories">
          Back to categories
        </Link>
      </p>
    </AppShell>
  );
}
