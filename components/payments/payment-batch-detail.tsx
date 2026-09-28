import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import type { PaymentBatchDetail as PaymentBatchDetailView } from "@/lib/payments/history";

export async function PaymentBatchDetail({ batch }: { batch: PaymentBatchDetailView }) {
  const { t, locale } = await getTranslations();

  return (
    <div className="batch-detail">
      <Card>
        <h2>{batch.reference}</h2>
        <dl className="payment-sheet-facts">
          <div>
            <dt>{t("payments.totalLabel")}</dt>
            <dd>{money(batch.amount, batch.currency, locale)}</dd>
          </div>
          <div>
            <dt>{t("payments.statusLabel")}</dt>
            <dd>{batchStatusLabel(t, batch.batchStatus)}</dd>
          </div>
          <div>
            <dt>{t("payments.createdAt")}</dt>
            <dd>{batch.createdAt.slice(0, 10)}</dd>
          </div>
          <div>
            <dt>{t("payments.confirmedAt")}</dt>
            <dd>{batch.confirmedAt ? batch.confirmedAt.slice(0, 10) : t("common.dash")}</dd>
          </div>
          <div>
            <dt>{t("payments.attachmentCount")}</dt>
            <dd>{t("payments.evidenceGap", { expenses: batch.expenses.length, receipts: batch.attachmentCount })}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2>{t("payments.selectedExpenses")}</h2>
        {batch.expenses.length === 0 ? <p>{t("payments.noBatches")}</p> : null}
        <ul className="bulk-payment-lines">
          {batch.expenses.map((expense) => (
            <li key={expense.id}>
              <span>
                {expense.description}
                <small className="batch-review-meta">
                  {" "}
                  {expense.category || t("common.uncategorized")}
                  {" · "}
                  {expense.date}
                  {expense.vendor ? ` · ${expense.vendor}` : ""}
                  {" · "}
                  {expense.hasEvidence ? t("payments.receiptAvailable") : t("payments.receiptMissing")}
                </small>
              </span>
              <span>{money(expense.amount, expense.currency, locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2>{t("nav.notifications")}</h2>
        {batch.notifications.length === 0 ? <p>{t("payments.noNotifications")}</p> : null}
        <ul className="bulk-payment-lines">
          {batch.notifications.map((notification) => (
            <li key={notification.id}>
              <span>
                {notification.channel}
                {" · "}
                {notificationStatusLabel(t, notification.status)}
                {" · "}
                {notification.recipient}
                <small className="batch-review-meta"> {notification.message.slice(0, 140)}</small>
                {notification.errorMessage ? <small className="batch-review-meta"> {notification.errorMessage}</small> : null}
              </span>
              <span>{(notification.sentAt ?? notification.createdAt).slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p>
        <Link className="auth-link" href="/payments">{t("common.back")}</Link>
      </p>
    </div>
  );
}

export function batchStatusLabel(t: (key: string, params?: Record<string, string | number>) => string, status: string) {
  if (status === "draft") return t("payments.batchDraft");
  if (status === "pending") return t("payments.batchPending");
  if (status === "paid") return t("payments.batchPaid");
  if (status === "cancelled") return t("payments.batchCancelled");
  if (status === "failed") return t("payments.batchFailed");
  return status;
}

export function notificationStatusLabel(t: (key: string, params?: Record<string, string | number>) => string, status: string) {
  if (status === "draft") return t("payments.notificationDraft");
  if (status === "pending") return t("payments.notificationPending");
  if (status === "sent") return t("payments.notificationSentStatus");
  if (status === "delivered") return t("payments.notificationDelivered");
  if (status === "failed") return t("payments.notificationFailedStatus");
  if (status === "cancelled") return t("payments.notificationCancelled");
  return status;
}

function money(amount: number, currency: string, locale: string) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}
