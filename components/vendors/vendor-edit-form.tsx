import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateVendorAction } from "@/lib/vendors/actions";
import type { Vendor } from "@/lib/vendors/types";

type VendorEditFormProps = {
  vendor: Vendor;
};

export function VendorEditForm({ vendor }: VendorEditFormProps) {
  const updateVendor = updateVendorAction.bind(null, vendor.id);

  return (
    <Card className="category-form-card">
      <form action={updateVendor} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={vendor.name}
          id="vendor-name"
          label="Name"
          name="name"
          placeholder="e.g. Cloud Provider"
          required
        />
        <AuthField
          autoComplete="off"
          defaultValue={vendor.contact_info ?? ""}
          id="vendor-contact"
          label="Contact info"
          name="contact_info"
          placeholder="e.g. billing@cloud.example"
        />
        <div className="category-form-actions">
          <Button type="submit">Save changes</Button>
          <Link className="auth-link" href="/vendors">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
