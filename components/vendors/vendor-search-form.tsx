import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

type VendorSearchFormProps = {
  defaultValue?: string;
};

export async function VendorSearchForm({ defaultValue }: VendorSearchFormProps) {
  const { t } = await getTranslations();

  return (
    <form action="/vendors" className="list-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="vendor-search">
        {t("vendors.searchPlaceholder")}
      </label>
      <input
        defaultValue={defaultValue}
        id="vendor-search"
        name="q"
        placeholder={t("vendors.searchPlaceholder")}
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        {t("common.search")}
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/vendors">
          {t("common.clear")}
        </Link>
      ) : null}
    </form>
  );
}
