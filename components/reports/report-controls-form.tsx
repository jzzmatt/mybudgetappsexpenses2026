import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "@/lib/reports/types";
import type { ReportFilters } from "@/lib/reports/types";

type ReportControlsFormProps = {
  filters: ReportFilters;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export function ReportControlsForm({ filters }: ReportControlsFormProps) {
  const showMonth = filters.type === "category" || filters.type === "project";

  return (
    <form action="/reports" className="report-controls-form" method="get">
      <label className="auth-field report-control-field" htmlFor="report-type">
        <span>Report type</span>
        <select defaultValue={filters.type} id="report-type" name="type">
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {REPORT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field report-control-field" htmlFor="report-currency">
        <span>Currency</span>
        <select defaultValue={filters.currency} id="report-currency" name="currency">
          {EXPENSE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
      </label>

      {filters.type !== "yearly" ? (
        <label className="auth-field report-control-field" htmlFor="report-year">
          <span>Year</span>
          <select defaultValue={filters.year} id="report-year" name="year">
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input name="year" type="hidden" value={filters.year} />
      )}

      {showMonth ? (
        <label className="auth-field report-control-field" htmlFor="report-month">
          <span>Month</span>
          <select
            defaultValue={filters.month === null ? "all" : String(filters.month)}
            id="report-month"
            name="month"
          >
            <option value="all">All months</option>
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;
              const label = new Date(2026, index, 1).toLocaleDateString("en-US", {
                month: "long",
              });
              return (
                <option key={month} value={month}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
      ) : filters.type === "monthly" ? (
        <input name="month" type="hidden" value="all" />
      ) : null}

      <button className="button button-small" type="submit">
        Generate
      </button>
    </form>
  );
}
