import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import type { ProjectCategoryAnalysis, ProjectVendorAnalysis } from "@/lib/projects/types";

type ProjectReportTablesProps = {
  categoryAnalysis: ProjectCategoryAnalysis[];
  vendorAnalysis: ProjectVendorAnalysis[];
  currency: ExpenseCurrency;
};

export async function ProjectReportTables({
  categoryAnalysis,
  vendorAnalysis,
  currency,
}: ProjectReportTablesProps) {
  const { t, locale } = await getTranslations();

  return (
    <div className="dashboard-tables-row">
      <Card className="dashboard-table-card">
        <div className="dashboard-table-header">
          <h2>{t("projects.categorySpending")}</h2>
        </div>
        {categoryAnalysis.length === 0 ? (
          <p className="dashboard-table-empty">{t("common.noResults")}</p>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table dashboard-table">
              <caption className="sr-only">{t("projects.categorySpending")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("expenses.category")}</th>
                  <th scope="col">{t("projects.projectBudget")}</th>
                  <th scope="col">{t("expenses.paid")}</th>
                  <th scope="col">{t("expenses.percentage")}</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalysis.map((item) => (
                  <tr key={item.category}>
                    <td><strong>{item.category}</strong></td>
                    <td>{formatCurrency(item.budget, currency, locale)}</td>
                    <td>{formatCurrency(item.paid, currency, locale)}</td>
                    <td>{item.percentOfBudget.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="dashboard-table-card">
        <div className="dashboard-table-header">
          <h2>{t("projects.vendorSpending")}</h2>
        </div>
        {vendorAnalysis.length === 0 ? (
          <p className="dashboard-table-empty">{t("common.noResults")}</p>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table dashboard-table">
              <caption className="sr-only">{t("projects.vendorSpending")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("expenses.vendor")}</th>
                  <th scope="col">{t("projects.numberOfExpenses")}</th>
                  <th scope="col">{t("projects.projectBudget")}</th>
                  <th scope="col">{t("expenses.paid")}</th>
                </tr>
              </thead>
              <tbody>
                {vendorAnalysis.map((item) => (
                  <tr key={item.vendor}>
                    <td><strong>{item.vendor}</strong></td>
                    <td>{item.expenseCount}</td>
                    <td>{formatCurrency(item.budget, currency, locale)}</td>
                    <td>{formatCurrency(item.paid, currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
