import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";
import { createVendorAction } from "@/lib/vendors/actions";

export async function VendorCreateForm() {
  const { t } = await getTranslations();

  return (
    <ResourceFormLayout description={t("vendors.description")} title={t("vendors.createTitle")}>
      <form action={createVendorAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="vendor-name"
          label={t("vendors.name")}
          name="name"
          placeholder="e.g. Cloud Provider"
          required
        />
        <AuthField
          autoComplete="off"
          id="vendor-contact"
          label={t("vendors.contactInfo")}
          name="contact_info"
          placeholder="e.g. billing@cloud.example"
        />
        <div className="resource-form-actions">
          <Button type="submit">{t("vendors.add")}</Button>
          <Link className="auth-link" href="/vendors">
            {t("common.cancel")}
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
