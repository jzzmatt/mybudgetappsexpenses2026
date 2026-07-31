import Link from "next/link";
import { buildDashboardQueryString } from "@/lib/dashboard/params";
import type { DashboardPeriod } from "@/lib/dashboard/types";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";

type DashboardPeriodFormProps = {
  period: DashboardPeriod;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export function DashboardPeriodForm({ period }: DashboardPeriodFormProps) {
  const allMonthsHref = `/dashboard${buildDashboardQueryString({
    year: period.year,
    month: null,
    currency: period.currency,
  })}`;

  const periodLabel =
    period.month === null
      ? String(period.year)
      : new Date(period.year, period.month - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

  return (
    <form action="/dashboard" className="dashboard-period-form" method="get">
      <span className="dashboard-period-pill" title="Selected period">
        {periodLabel}
      </span>
      <details className="dashboard-period-details">
        <summary className="dashboard-period-trigger">Change period</summary>
        <div className="dashboard-period-panel">
          <label className="auth-field dashboard-period-field" htmlFor="dashboard-currency">
            <span>Currency</span>
            <select defaultValue={period.currency} id="dashboard-currency" name="currency">
              {EXPENSE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {CURRENCY_LABELS[currency]}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field dashboard-period-field" htmlFor="dashboard-year">
            <span>Year</span>
            <select defaultValue={period.year} id="dashboard-year" name="year">
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field dashboard-period-field" htmlFor="dashboard-month">
            <span>Month</span>
            <select
              defaultValue={period.month === null ? "all" : String(period.month)}
              id="dashboard-month"
              name="month"
            >
              <option value="all">All months</option>
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;
                const label = new Date(2026, index, 1).toLocaleDateString("en-US", { month: "long" });
                return (
                  <option key={month} value={month}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
          <button className="button button-small" type="submit">
            Apply
          </button>
          {period.month !== null ? (
            <Link className="auth-link" href={allMonthsHref}>
              View full year
            </Link>
          ) : null}
        </div>
      </details>
    </form>
  );
}
