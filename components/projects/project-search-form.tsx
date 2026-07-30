import Link from "next/link";

type ProjectSearchFormProps = {
  defaultValue?: string;
};

export function ProjectSearchForm({ defaultValue }: ProjectSearchFormProps) {
  return (
    <form action="/projects" className="category-search-form" method="get" role="search">
      <label className="sr-only" htmlFor="project-search">
        Search projects
      </label>
      <input
        defaultValue={defaultValue}
        id="project-search"
        name="q"
        placeholder="Search projects…"
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        Search
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/projects">
          Clear
        </Link>
      ) : null}
    </form>
  );
}
