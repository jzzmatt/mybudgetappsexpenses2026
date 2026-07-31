import Link from "next/link";
import { DeleteVendorButton } from "@/components/vendors/delete-vendor-button";
import { Card } from "@/components/ui/card";
import type { Vendor } from "@/lib/vendors/types";

type VendorListProps = {
  vendors: Vendor[];
  search?: string;
};

export function VendorList({ vendors, search }: VendorListProps) {
  if (vendors.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No vendors found</h2>
        <p>
          {search
            ? `No vendors match "${search}". Try a different search or create a new vendor.`
            : "Create your first vendor to track who you pay."}
        </p>
        <Link className="auth-link" href="/vendors/new">
          Create vendor
        </Link>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table">
          <caption className="sr-only">Vendors</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Contact info</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>{vendor.name}</td>
                <td>{vendor.contact_info || "—"}</td>
                <td className="category-table-actions">
                  <Link className="auth-link" href={`/vendors/${vendor.id}/edit`}>
                    Edit
                  </Link>
                  <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
