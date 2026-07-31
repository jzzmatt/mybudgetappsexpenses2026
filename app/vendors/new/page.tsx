import { AppShell } from "@/components/layout/app-shell";
import { VendorCreateForm } from "@/components/vendors/vendor-create-form";

type NewVendorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewVendorPage({ searchParams }: NewVendorPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell title="New vendor">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <VendorCreateForm />
    </AppShell>
  );
}
