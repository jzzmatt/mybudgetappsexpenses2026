import { CategorySearchForm } from "@/components/categories/category-search-form";
import { ListToolbarCard } from "@/components/layout/list-toolbar-card";

type CategoryToolbarProps = {
  search?: string;
};

export function CategoryToolbar({ search }: CategoryToolbarProps) {
  return (
    <ListToolbarCard>
      <CategorySearchForm defaultValue={search} />
    </ListToolbarCard>
  );
}
