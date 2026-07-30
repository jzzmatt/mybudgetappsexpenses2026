import Link from "next/link";
import { DeleteCategoryButton } from "@/components/categories/delete-category-button";
import { Card } from "@/components/ui/card";
import type { Category } from "@/lib/categories/types";

type CategoryListProps = {
  categories: Category[];
  search?: string;
};

export function CategoryList({ categories, search }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No categories found</h2>
        <p>
          {search
            ? `No categories match "${search}". Try a different search or create a new category.`
            : "Create your first category to organize expenses and budgets."}
        </p>
        <Link className="auth-link" href="/categories/new">
          Create category
        </Link>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Description</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description || "—"}</td>
                <td className="category-table-actions">
                  <Link className="auth-link" href={`/categories/${category.id}/edit`}>
                    Edit
                  </Link>
                  <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
