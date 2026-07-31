import Link from "next/link";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { buildReportQueryString } from "@/lib/reports/params";
import type { ReportPeriod } from "@/lib/reports/types";

type ReportsPeriodControlsProps = {
  period: ReportPeriod;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export function ReportsPeriodControls({ period }: ReportsPeriodControlsProps) {
  const periodLabel =
    period.month === null
      ? String(period.year)
      : new Date(period.year, period.month - 1, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

  return (
    <div className="reports-period-controls">
      <span className="dashboard-period-pill" title="Selected period">
        {periodLabel}
      </span>
      <Link
        className="button button-small reports-generate-button"
        href={`/reports${buildReportQueryString(period)}`}
      >
        Generate
      </Link>
      <details className="dashboard-period-details">
        <summary className="dashboard-period-trigger">Change period</summary>
        <form action="/reports" className="dashboard-period-panel" method="get">
          <label className="auth-field dashboard-period-field" htmlFor="reports-currency">
            <span>Currency</span>
            <select defaultValue={period.currency} id="reports-currency" name="currency">
              {EXPENSE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {CURRENCY_LABELS[currency]}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field dashboard-period-field" htmlFor="reports-year">
            <span>Year</span>
            <select defaultValue={period.year} id="reports-year" name="year">
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field dashboard-period-field" htmlFor="reports-month">
            <span>Month</span>
            <select
              defaultValue={period.month === null ? "all" : String(period.month)}
              id="reports-month"
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
        </form>
      </details>
    </div>
  );
}
