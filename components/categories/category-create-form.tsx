import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createCategoryAction } from "@/lib/categories/actions";

export function CategoryCreateForm() {
  return (
    <Card className="category-form-card">
      <form action={createCategoryAction} className="category-form">
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
        <div className="category-form-actions">
          <Button type="submit">Create category</Button>
          <Link className="auth-link" href="/categories">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
