import { Card } from "@/components/ui/card";
import { getIntlLocale } from "@/lib/i18n/locale-format";
import { getTranslations } from "@/lib/i18n/server";
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

export async function AiReportView({ report }: AiReportViewProps) {
  const { t, locale } = await getTranslations();
  const intlLocale = getIntlLocale(locale);

  return (
    <div className="ai-report-content">
      <Card className="ai-report-section-card">
        <h2>{t("aiReport.executiveSummary")}</h2>
        <p>{report.executive_summary}</p>
        <p className="ai-report-meta">
          {new Date(report.generated_at).toLocaleString(intlLocale)} · {t("projects.currency")}:{" "}
          {report.currency}
        </p>
      </Card>

      {report.spending_analysis ? (
        <Card className="ai-report-section-card">
          <h2>{t("aiReport.spendingAnalysis")}</h2>
          <p>{report.spending_analysis}</p>
        </Card>
      ) : null}

      <BulletList items={report.key_findings} title={t("aiReport.keyFindings")} />
      <BulletList items={report.largest_items} title={t("aiReport.largestItems")} />
      <BulletList items={report.pending_items} title={t("aiReport.pendingItems")} />
      <BulletList items={report.recommendations} title={t("aiReport.recommendations")} />
      <BulletList items={report.risk_alerts} title={t("aiReport.riskAlerts")} />
    </div>
  );
}
