import Link from "next/link";
import { DeleteVendorButton } from "@/components/vendors/delete-vendor-button";
import { Card } from "@/components/ui/card";
import { getTranslations } from "@/lib/i18n/server";
import type { Vendor } from "@/lib/vendors/types";

type VendorListProps = {
  vendors: Vendor[];
  search?: string;
};

export async function VendorList({ vendors, search }: VendorListProps) {
  const { t } = await getTranslations();

  if (vendors.length === 0) {
    return (
      <Card className="list-empty-card">
        <h2>{t("vendors.noVendors")}</h2>
        <p>{search ? t("common.noResults") : t("vendors.noVendors")}</p>
        <Link className="button button-small" href="/vendors/new">
          {t("vendors.add")}
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="list-mobile-cards">
        {vendors.map((vendor) => (
          <Card className="list-mobile-card" key={vendor.id}>
            <div className="list-mobile-card-header">
              <h3>{vendor.name}</h3>
            </div>
            <p className="list-mobile-card-meta">
              {vendor.contact_info || t("common.optional")}
            </p>
            <div className="list-mobile-card-actions">
              <Link className="auth-link" href={`/vendors/${vendor.id}/edit`}>
                {t("common.edit")}
              </Link>
              <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="category-table-card list-desktop-table">
        <div className="category-table-wrap">
          <table className="category-table list-table">
            <caption className="sr-only">{t("vendors.title")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("vendors.name")}</th>
                <th scope="col">{t("vendors.contactInfo")}</th>
                <th scope="col">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.name}</td>
                  <td>{vendor.contact_info || t("common.dash")}</td>
                  <td className="category-table-actions">
                    <Link className="auth-link" href={`/vendors/${vendor.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                    <DeleteVendorButton vendorId={vendor.id} vendorName={vendor.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
