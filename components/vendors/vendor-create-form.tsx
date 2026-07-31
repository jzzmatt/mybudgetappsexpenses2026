import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createVendorAction } from "@/lib/vendors/actions";

export function VendorCreateForm() {
  return (
    <ResourceFormLayout
      description="Add a vendor or supplier for your expense records."
      title="Vendor details"
    >
      <form action={createVendorAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="vendor-name"
          label="Name"
          name="name"
          placeholder="e.g. Cloud Provider"
          required
        />
        <AuthField
          autoComplete="off"
          id="vendor-contact"
          label="Contact info"
          name="contact_info"
          placeholder="e.g. billing@cloud.example"
        />
        <div className="resource-form-actions">
          <Button type="submit">Create vendor</Button>
          <Link className="auth-link" href="/vendors">
            Cancel
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
