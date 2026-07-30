import Link from "next/link";
import { VendorSearchForm } from "@/components/vendors/vendor-search-form";

type VendorToolbarProps = {
  search?: string;
};

export function VendorToolbar({ search }: VendorToolbarProps) {
  return (
    <div className="category-toolbar">
      <VendorSearchForm defaultValue={search} />
      <Link className="button button-small" href="/vendors/new">
        New vendor
      </Link>
    </div>
  );
}
