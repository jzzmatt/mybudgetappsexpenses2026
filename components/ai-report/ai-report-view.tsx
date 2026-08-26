import { Card } from "@/components/ui/card";
import type { AiReportResult } from "@/lib/ai-report/types";

type AiReportViewProps = {
  report: AiReportResult;
};

function BulletList({ items, title }: { items?: string[]; title: string }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="ai-report-section-card">
      <h2>{title}</h2>
      <ul className="ai-report-list">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export function AiReportView({ report }: AiReportViewProps) {
  return (
    <div className="ai-report-content">
      <Card className="ai-report-section-card">
        <h2>Executive Summary</h2>
        <p>{report.executive_summary}</p>
        <p className="ai-report-meta">
          Generated {new Date(report.generated_at).toLocaleString("en-US")} · Currency: {report.currency}
        </p>
      </Card>

      {report.spending_analysis ? (
        <Card className="ai-report-section-card">
          <h2>Spending &amp; Allocation Analysis</h2>
          <p>{report.spending_analysis}</p>
        </Card>
      ) : null}

      <BulletList items={report.key_findings} title="Key Findings" />
      <BulletList items={report.largest_items} title="Largest Budget Commitments" />
      <BulletList items={report.pending_items} title="Pending &amp; Partial Items" />
      <BulletList items={report.recommendations} title="Strategic Recommendations" />
      <BulletList items={report.risk_alerts} title="Risk Alerts" />
    </div>
  );
}
