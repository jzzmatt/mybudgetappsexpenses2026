import Link from "next/link";

type VendorSearchFormProps = {
  defaultValue?: string;
};

export function VendorSearchForm({ defaultValue }: VendorSearchFormProps) {
  return (
    <form action="/vendors" className="list-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="vendor-search">
        Search vendors
      </label>
      <input
        defaultValue={defaultValue}
        id="vendor-search"
        name="q"
        placeholder="Search vendors…"
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        Search
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/vendors">
          Clear
        </Link>
      ) : null}
    </form>
  );
}
