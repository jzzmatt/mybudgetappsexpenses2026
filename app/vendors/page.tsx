import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { PageActionButton } from "@/components/layout/page-action-button";
import { VendorList } from "@/components/vendors/vendor-list";
import { VendorToolbar } from "@/components/vendors/vendor-toolbar";
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
    <AppShell
      actions={<PageActionButton href="/vendors/new">Add vendor</PageActionButton>}
      title="Vendors"
    >
      {loadError ? (
        <p className="form-error page-error" role="alert">
          {loadError}
        </p>
      ) : null}
      <ListPageContent>
        <VendorToolbar search={q} />
        <VendorList vendors={vendors} search={q} />
      </ListPageContent>
    </AppShell>
  );
}
