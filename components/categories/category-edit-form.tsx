import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateCategoryAction } from "@/lib/categories/actions";
import type { Category } from "@/lib/categories/types";

type CategoryEditFormProps = {
  category: Category;
};

export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const updateCategory = updateCategoryAction.bind(null, category.id);

  return (
    <Card className="category-form-card">
      <form action={updateCategory} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={category.name}
          id="category-name"
          label="Name"
          name="name"
          placeholder="e.g. Technology"
          required
        />
        <label className="auth-field" htmlFor="category-description">
          <span>Description</span>
          <textarea
            defaultValue={category.description ?? ""}
            id="category-description"
            name="description"
            placeholder="Optional description"
            rows={4}
          />
        </label>
        <div className="category-form-actions">
          <Button type="submit">Save changes</Button>
          <Link className="auth-link" href="/categories">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
