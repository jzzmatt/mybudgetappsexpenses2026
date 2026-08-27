import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n/server";
import { updateVendorAction } from "@/lib/vendors/actions";
import type { Vendor } from "@/lib/vendors/types";

type VendorEditFormProps = {
  vendor: Vendor;
};

export async function VendorEditForm({ vendor }: VendorEditFormProps) {
  const { t } = await getTranslations();
  const updateVendor = updateVendorAction.bind(null, vendor.id);

  return (
    <Card className="category-form-card">
      <form action={updateVendor} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={vendor.name}
          id="vendor-name"
          label={t("vendors.name")}
          name="name"
          placeholder="e.g. Cloud Provider"
          required
        />
        <AuthField
          autoComplete="off"
          defaultValue={vendor.contact_info ?? ""}
          id="vendor-contact"
          label={t("vendors.contactInfo")}
          name="contact_info"
          placeholder="e.g. billing@cloud.example"
        />
        <div className="category-form-actions">
          <Button type="submit">{t("common.save")}</Button>
          <Link className="auth-link" href="/vendors">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </Card>
  );
}
