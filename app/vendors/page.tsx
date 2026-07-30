import Link from "next/link";
import { VendorList } from "@/components/vendors/vendor-list";
import { VendorToolbar } from "@/components/vendors/vendor-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import { getVendors } from "@/lib/vendors/queries";
import type { Vendor } from "@/lib/vendors/types";

type VendorsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const { q } = await searchParams;

  let vendors: Vendor[] = [];
  let loadError: string | undefined;

  try {
    vendors = await getVendors(q);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Unable to load vendors. Check your Supabase and Clerk integration.";
  }

  return (
    <AppShell description="Manage suppliers and service providers." title="Vendors">
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <VendorToolbar search={q} />
      <VendorList vendors={vendors} search={q} />
      <p className="category-footer-link">
        <Link className="auth-link" href="/dashboard">
          Back to dashboard
        </Link>
      </p>
    </AppShell>
  );
}
