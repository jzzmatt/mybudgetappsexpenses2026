import { Card } from "@/components/ui/card";
import { BudgetProgressBar } from "@/components/budgets/budget-progress-bar";
import { formatCurrency } from "@/lib/currency/format";
import type { ReportData } from "@/lib/reports/types";

type ReportTableProps = {
  report: ReportData;
};

export function ReportTable({ report }: ReportTableProps) {
  if (report.rows.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No report data</h2>
        <p>There are no expenses matching the selected report filters.</p>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table report-table">
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Budget</th>
              <th scope="col">Paid</th>
              <th scope="col">Remaining</th>
              <th scope="col">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{formatCurrency(row.budget, report.currency)}</td>
                <td>{formatCurrency(row.paid, report.currency)}</td>
                <td>{formatCurrency(row.remaining, report.currency)}</td>
                <td className="budget-progress-cell">
                  <BudgetProgressBar percent={row.utilization_percent} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
