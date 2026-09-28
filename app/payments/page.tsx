import Link from "next/link";
import { batchStatusClass, batchStatusLabel } from "@/components/payments/payment-batch-detail";
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
        {batches.length > 0 ? (
          <>
            <div className="payment-mobile-cards">
              {batches.map((batch) => (
                <Card className="list-mobile-card" key={batch.id}>
                  <div className="list-mobile-card-header">
                    <h3>{batch.reference}</h3>
                    <span className={batchStatusClass(batch.batchStatus)}>{batchStatusLabel(t, batch.batchStatus)}</span>
                  </div>
                  <dl className="list-mobile-card-details">
                    <div>
                      <dt>{t("payments.totalLabel")}</dt>
                      <dd>{money(batch.amount, batch.currency, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("nav.expenses")}</dt>
                      <dd>{batch.expenseCount}</dd>
                    </div>
                    <div>
                      <dt>{t("expenses.date")}</dt>
                      <dd>{batch.paymentDate}</dd>
                    </div>
                  </dl>
                  <Link className="button button-outline button-small" href={`/payments/${batch.id}`}>{t("payments.openBatch")}</Link>
                </Card>
              ))}
            </div>
            <Card className="category-table-card payment-desktop-table">
              <div className="category-table-wrap">
                <table className="payment-batch-table">
                  <caption className="sr-only">{t("payments.historyTitle")}</caption>
                  <colgroup>
                    <col className="payment-col-reference" />
                    <col className="payment-col-status" />
                    <col className="payment-col-total" />
                    <col className="payment-col-count" />
                    <col className="payment-col-date" />
                    <col className="payment-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{t("expenses.paymentReference")}</th>
                      <th scope="col">{t("payments.statusLabel")}</th>
                      <th scope="col">{t("payments.totalLabel")}</th>
                      <th scope="col">{t("nav.expenses")}</th>
                      <th scope="col">{t("expenses.date")}</th>
                      <th scope="col">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr key={batch.id}>
                        <th scope="row">{batch.reference}</th>
                        <td><span className={batchStatusClass(batch.batchStatus)}>{batchStatusLabel(t, batch.batchStatus)}</span></td>
                        <td>{money(batch.amount, batch.currency, locale)}</td>
                        <td>{batch.expenseCount}</td>
                        <td>{batch.paymentDate}</td>
                        <td>
                          <Link className="auth-link" href={`/payments/${batch.id}`}>{t("payments.openBatch")}</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
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
