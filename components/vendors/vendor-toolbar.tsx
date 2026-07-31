import { ListToolbarCard } from "@/components/layout/list-toolbar-card";
import { VendorSearchForm } from "@/components/vendors/vendor-search-form";

type VendorToolbarProps = {
  search?: string;
};

export function VendorToolbar({ search }: VendorToolbarProps) {
  return (
    <ListToolbarCard>
      <VendorSearchForm defaultValue={search} />
    </ListToolbarCard>
  );
}
