import Link from "next/link";
import { CategorySearchForm } from "@/components/categories/category-search-form";

type CategoryToolbarProps = {
  search?: string;
};

export function CategoryToolbar({ search }: CategoryToolbarProps) {
  return (
    <div className="category-toolbar">
      <CategorySearchForm defaultValue={search} />
      <Link className="button button-small" href="/categories/new">
        New category
      </Link>
    </div>
  );
}
