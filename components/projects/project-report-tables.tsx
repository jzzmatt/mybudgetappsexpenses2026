import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import type { ExpenseCurrency } from "@/lib/currency/types";
import type { ProjectCategoryAnalysis, ProjectVendorAnalysis } from "@/lib/projects/types";

type ProjectReportTablesProps = {
  categoryAnalysis: ProjectCategoryAnalysis[];
  vendorAnalysis: ProjectVendorAnalysis[];
  currency: ExpenseCurrency;
};

export function ProjectReportTables({
  categoryAnalysis,
  vendorAnalysis,
  currency,
}: ProjectReportTablesProps) {
  return (
    <div className="dashboard-tables-row">
      <Card className="dashboard-table-card">
        <div className="dashboard-table-header">
          <h2>Category Breakdown</h2>
        </div>
        {categoryAnalysis.length === 0 ? (
          <p className="dashboard-table-empty">No category expenses recorded.</p>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table dashboard-table">
              <caption className="sr-only">Category Breakdown</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Budget</th>
                  <th scope="col">Paid</th>
                  <th scope="col">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalysis.map((item) => (
                  <tr key={item.category}>
                    <td><strong>{item.category}</strong></td>
                    <td>{formatCurrency(item.budget, currency)}</td>
                    <td>{formatCurrency(item.paid, currency)}</td>
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
          <h2>Vendor Breakdown</h2>
        </div>
        {vendorAnalysis.length === 0 ? (
          <p className="dashboard-table-empty">No vendor expenses recorded.</p>
        ) : (
          <div className="category-table-wrap">
            <table className="category-table dashboard-table">
              <caption className="sr-only">Vendor Breakdown</caption>
              <thead>
                <tr>
                  <th scope="col">Vendor</th>
                  <th scope="col">Expenses</th>
                  <th scope="col">Budget</th>
                  <th scope="col">Paid</th>
                </tr>
              </thead>
              <tbody>
                {vendorAnalysis.map((item) => (
                  <tr key={item.vendor}>
                    <td><strong>{item.vendor}</strong></td>
                    <td>{item.expenseCount}</td>
                    <td>{formatCurrency(item.budget, currency)}</td>
                    <td>{formatCurrency(item.paid, currency)}</td>
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
