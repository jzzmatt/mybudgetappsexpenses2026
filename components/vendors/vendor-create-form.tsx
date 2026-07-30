import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createVendorAction } from "@/lib/vendors/actions";

export function VendorCreateForm() {
  return (
    <Card className="category-form-card">
      <form action={createVendorAction} className="category-form">
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
        <div className="category-form-actions">
          <Button type="submit">Create vendor</Button>
          <Link className="auth-link" href="/vendors">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
