import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { buildAiReportQueryString } from "@/lib/ai-report/params";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import { getTranslations } from "@/lib/i18n/server";
import type { AiReportFilters } from "@/lib/ai-report/types";

type AiReportControlsFormProps = {
  filters: AiReportFilters;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - index);

export async function AiReportControlsForm({ filters }: AiReportControlsFormProps) {
  const { t, locale } = await getTranslations();
  const intlLocale = getIntlLocale(locale);
  const action = `/ai-report${buildAiReportQueryString(filters, true)}`;

  return (
    <form action={action} className="report-controls-form" method="get">
      <label className="auth-field report-control-field" htmlFor="ai-report-currency">
        <span>{t("projects.currency")}</span>
        <select defaultValue={filters.currency} id="ai-report-currency" name="currency">
          {EXPENSE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field report-control-field" htmlFor="ai-report-year">
        <span>{t("expenses.allYears").replace("All ", "")}</span>
        <select defaultValue={filters.year} id="ai-report-year" name="year">
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field report-control-field" htmlFor="ai-report-month">
        <span>{t("expenses.allMonths").replace("All ", "")}</span>
        <select
          defaultValue={filters.month === null ? "all" : String(filters.month)}
          id="ai-report-month"
          name="month"
        >
          <option value="all">{t("expenses.allMonths")}</option>
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const label = new Date(2026, index, 1).toLocaleDateString(intlLocale, { month: "long" });
            return (
              <option key={month} value={month}>
                {label}
              </option>
            );
          })}
        </select>
      </label>

      <input name="generate" type="hidden" value="true" />
      <button className="button button-small" type="submit">
        {t("aiReport.generate")}
      </button>
    </form>
  );
}
