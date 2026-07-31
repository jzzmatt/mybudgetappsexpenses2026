import Link from "next/link";

type CategorySearchFormProps = {
  defaultValue?: string;
};

export function CategorySearchForm({ defaultValue }: CategorySearchFormProps) {
  return (
    <form action="/categories" className="list-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="category-search">
        Search categories
      </label>
      <input
        defaultValue={defaultValue}
        id="category-search"
        name="q"
        placeholder="Search categories…"
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        Search
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/categories">
          Clear
        </Link>
      ) : null}
    </form>
  );
}
