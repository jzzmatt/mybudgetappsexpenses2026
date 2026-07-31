import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createCategoryAction } from "@/lib/categories/actions";

export function CategoryCreateForm() {
  return (
    <ResourceFormLayout
      description="Add a category to organize expenses and budgets."
      title="Category details"
    >
      <form action={createCategoryAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="category-name"
          label="Name"
          name="name"
          placeholder="e.g. Technology"
          required
        />
        <label className="auth-field" htmlFor="category-description">
          <span>Description</span>
          <textarea
            id="category-description"
            name="description"
            placeholder="Optional description"
            rows={4}
          />
        </label>
        <div className="resource-form-actions">
          <Button type="submit">Create category</Button>
          <Link className="auth-link" href="/categories">
            Cancel
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
