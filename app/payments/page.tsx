import Link from "next/link";
import { batchStatusLabel } from "@/components/payments/payment-batch-detail";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { listPaymentBatches } from "@/lib/payments/history";

export default async function PaymentsPage() {
  const { t, locale } = await getTranslations();
  let loadError: string | undefined;
  let batches: Awaited<ReturnType<typeof listPaymentBatches>> = [];

  try {
    batches = await listPaymentBatches();
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("payments.noBatches");
  }

  return (
    <AppShell description={t("payments.historyDescription")} title={t("payments.historyTitle")}>
      {loadError ? <p className="form-error page-error" role="alert">{loadError}</p> : null}
      <ListPageContent>
        {batches.length === 0 && !loadError ? (
          <Card className="list-empty-card">
            <h2>{t("payments.noBatches")}</h2>
          </Card>
        ) : null}
        {batches.map((batch) => (
          <Card key={batch.id}>
            <div className="list-mobile-card-header">
              <h3>{batch.reference}</h3>
              <span>{batchStatusLabel(t, batch.batchStatus)}</span>
            </div>
            <p className="list-mobile-card-meta">
              {money(batch.amount, batch.currency, locale)}
              {" · "}
              {t("payments.selectedCount", { count: batch.expenseCount })}
              {" · "}
              {batch.paymentDate}
            </p>
            <Link className="auth-link" href={`/payments/${batch.id}`}>{t("payments.openBatch")}</Link>
          </Card>
        ))}
      </ListPageContent>
    </AppShell>
  );
}

function money(amount: number, currency: string, locale: string) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}
