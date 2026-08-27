import { AppShell } from "@/components/layout/app-shell";
import { VendorCreateForm } from "@/components/vendors/vendor-create-form";
import { getTranslations } from "@/lib/i18n/server";

type NewVendorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewVendorPage({ searchParams }: NewVendorPageProps) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  return (
    <AppShell title={t("vendors.createTitle")}>
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <VendorCreateForm />
    </AppShell>
  );
}
