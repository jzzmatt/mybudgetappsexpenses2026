import { Card } from "@/components/ui/card";
import type { AiReportResult } from "@/lib/ai-report/types";

type AiReportViewProps = {
  report: AiReportResult;
};

function BulletList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="ai-report-section-card">
      <h2>{title}</h2>
      <ul className="ai-report-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export function AiReportView({ report }: AiReportViewProps) {
  return (
    <div className="ai-report-content">
      <Card className="ai-report-section-card">
        <h2>Executive summary</h2>
        <p>{report.executive_summary}</p>
        <p className="ai-report-meta">
          Generated {new Date(report.generated_at).toLocaleString("en-US")} · {report.currency}
        </p>
      </Card>
      <BulletList items={report.key_findings} title="Key findings" />
      <BulletList items={report.recommendations} title="Recommendations" />
      <BulletList items={report.risk_alerts} title="Risk alerts" />
    </div>
  );
}
