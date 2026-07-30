import Link from "next/link";
import { VendorCreateForm } from "@/components/vendors/vendor-create-form";
import { AppShell } from "@/components/layout/app-shell";

type NewVendorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewVendorPage({ searchParams }: NewVendorPageProps) {
  const { error } = await searchParams;

  return (
    <AppShell description="Add a new vendor or supplier." title="New vendor">
      {error ? (
        <p className="form-error page-error" role="alert">
          {error}
        </p>
      ) : null}
      <VendorCreateForm />
      <p className="category-footer-link">
        <Link className="auth-link" href="/vendors">
          Back to vendors
        </Link>
      </p>
    </AppShell>
  );
}
