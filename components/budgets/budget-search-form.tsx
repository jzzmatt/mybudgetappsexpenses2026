import Link from "next/link";

type BudgetSearchFormProps = {
  defaultValue?: string;
  hiddenFields?: Record<string, string>;
};

export function BudgetSearchForm({ defaultValue, hiddenFields }: BudgetSearchFormProps) {
  return (
    <form action="/budgets" className="list-search-form" method="get" role="search">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} name={name} type="hidden" value={value} />
          ))
        : null}
      <label className="sr-only" htmlFor="budget-search">
        Search budgets
      </label>
      <input
        defaultValue={defaultValue}
        id="budget-search"
        name="q"
        placeholder="Search budgets…"
        type="search"
      />
      <button className="button button-outline button-small" type="submit">
        Search
      </button>
      {defaultValue ? (
        <Link className="auth-link" href="/budgets">
          Clear
        </Link>
      ) : null}
    </form>
  );
}
