import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

type CategorySearchFormProps = {
  defaultValue?: string;
};

export async function CategorySearchForm({ defaultValue }: CategorySearchFormProps) {
  const { t } = await getTranslations();

  return (
    <form action="/categories" className="list-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="category-search">
        {t("categories.searchPlaceholder")}
      </label>
      <input
        defaultValue={defaultValue}
        id="category-search"
        name="q"
        placeholder={t("categories.searchPlaceholder")}
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        {t("common.search")}
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/categories">
          {t("common.clear")}
        </Link>
      ) : null}
    </form>
  );
}
