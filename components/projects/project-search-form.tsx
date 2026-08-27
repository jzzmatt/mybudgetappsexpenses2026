import Link from "next/link";
import { getTranslations } from "@/lib/i18n/server";

type ProjectSearchFormProps = {
  defaultValue?: string;
};

export async function ProjectSearchForm({ defaultValue }: ProjectSearchFormProps) {
  const { t } = await getTranslations();

  return (
    <form action="/projects" className="list-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="project-search">
        {t("projects.searchPlaceholder")}
      </label>
      <input
        defaultValue={defaultValue}
        id="project-search"
        name="q"
        placeholder={t("projects.searchPlaceholder")}
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        {t("common.search")}
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/projects">
          {t("common.clear")}
        </Link>
      ) : null}
    </form>
  );
}
