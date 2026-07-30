import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorEditForm } from "@/components/vendors/vendor-edit-form";
import { AppShell } from "@/components/layout/app-shell";
import { getVendorById } from "@/lib/vendors/queries";

type EditVendorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditVendorPage({ params, searchParams }: EditVendorPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const vendor = await getVendorById(id);

  if (!vendor) {
    notFound();
  }

  return (
    <AppShell description={`Update details for ${vendor.name}.`} title="Edit vendor">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <VendorEditForm vendor={vendor} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/vendors">
          Back to vendors
        </Link>
      </p>
    </AppShell>
  );
}
