import Link from "next/link";
import { WhatsAppShareButton } from "@/components/expenses/whatsapp-share-button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { translateEnum } from "@/lib/i18n/translator";
import { getTranslations } from "@/lib/i18n/server";
import { renderPaymentNotification } from "@/lib/notifications/composer";
import type { PaymentBatchDetail as PaymentBatchDetailView } from "@/lib/payments/history";
import type { ExpensePaymentMethod } from "@/lib/expenses/types";
import { formatWhatsAppDate } from "@/lib/whatsapp/message";

export async function PaymentBatchDetail({ batch }: { batch: PaymentBatchDetailView }) {
  const { t, locale } = await getTranslations();
  const totalLabel = money(batch.amount, batch.currency, locale);
  const message = renderPaymentNotification({
    reference: batch.reference,
    totalLabel,
    attachmentCount: batch.attachmentCount,
    locale,
    expenses: batch.expenses.map((expense) => ({
      description: expense.description,
      amountLabel: money(expense.amount, expense.currency, locale),
      category: expense.category,
      dateLabel: formatWhatsAppDate(expense.date),
    })),
  });
  const methodLabel = batch.paymentMethod
    ? translateEnum(t, "paymentMethod", batch.paymentMethod as ExpensePaymentMethod)
    : t("common.dash");

  return (
    <div className="batch-detail">
      <Card>
        <div className="batch-detail-header">
          <div>
            <h2>{batch.reference}</h2>
            <p><span className={batchStatusClass(batch.batchStatus)}>{batchStatusLabel(t, batch.batchStatus)}</span></p>
          </div>
          {batch.batchStatus === "paid" ? (
            <WhatsAppShareButton
              amountLabel={totalLabel}
              categoryName={[...new Set(batch.expenses.map((expense) => expense.category).filter(Boolean))].join(", ") || t("common.dash")}
              description={batch.reference}
              evidenceNames={batch.evidenceFiles.map((file) => file.fileName)}
              expenseCount={batch.expenseCount}
              initialMessage={message}
              paymentDateLabel={formatWhatsAppDate(batch.paymentDate)}
              paymentId={batch.id}
              paymentMethodLabel={methodLabel}
              projectName={t("common.dash")}
            />
          ) : null}
        </div>
        <dl className="batch-summary">
          <div>
            <dt>{t("payments.totalLabel")}</dt>
            <dd>{totalLabel}</dd>
          </div>
          <div>
            <dt>{t("nav.expenses")}</dt>
            <dd>{batch.expenseCount}</dd>
          </div>
          <div>
            <dt>{t("expenses.date")}</dt>
            <dd>{batch.paymentDate}</dd>
          </div>
          <div>
            <dt>{t("payments.confirmedAt")}</dt>
            <dd>{batch.confirmedAt ? batch.confirmedAt.slice(0, 10) : t("common.dash")}</dd>
          </div>
          <div>
            <dt>{t("payments.attachmentCount")}</dt>
            <dd>{batch.attachmentCount}</dd>
          </div>
        </dl>
        {batch.evidenceFiles.length > 0 ? (
          <p className="batch-review-meta">{batch.evidenceFiles.map((file) => file.fileName).join(", ")}</p>
        ) : (
          <p className="batch-review-meta">{t("payments.receiptMissing")}</p>
        )}
      </Card>
      <Card>
        <h2>{t("payments.selectedExpenses")}</h2>
        {batch.expenses.length === 0 ? <p>{t("common.noResults")}</p> : null}
        {batch.expenses.length > 0 ? (
          <>
            <div className="payment-mobile-cards">
              {batch.expenses.map((expense) => (
                <article className="list-mobile-card" key={expense.id}>
                  <h3>{expense.description}</h3>
                  <p className="list-mobile-card-meta">
                    {expense.category || t("common.uncategorized")}
                    {" · "}
                    {expense.vendor || t("common.dash")}
                    {" · "}
                    {expense.date}
                  </p>
                  <p>{money(expense.amount, expense.currency, locale)}</p>
                  <p className="batch-review-meta">{expense.hasEvidence ? t("payments.receiptAvailable") : t("payments.receiptMissing")}</p>
                </article>
              ))}
            </div>
            <div className="category-table-wrap payment-desktop-table">
              <table className="payment-batch-table">
                <caption className="sr-only">{t("payments.selectedExpenses")}</caption>
                <colgroup>
                  <col className="payment-line-description" />
                  <col className="payment-line-category" />
                  <col className="payment-line-vendor" />
                  <col className="payment-line-date" />
                  <col className="payment-line-amount" />
                  <col className="payment-line-receipt" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t("expenses.description")}</th>
                    <th scope="col">{t("expenses.category")}</th>
                    <th scope="col">{t("expenses.vendor")}</th>
                    <th scope="col">{t("expenses.date")}</th>
                    <th scope="col">{t("expenses.paid")}</th>
                    <th scope="col">{t("payments.attachmentCount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <th scope="row">{expense.description}</th>
                      <td>{expense.category || t("common.uncategorized")}</td>
                      <td>{expense.vendor || t("common.dash")}</td>
                      <td>{expense.date}</td>
                      <td>{money(expense.amount, expense.currency, locale)}</td>
                      <td>{expense.hasEvidence ? t("payments.receiptAvailable") : t("payments.receiptMissing")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Card>
      <Card>
        <h2>{t("nav.notifications")}</h2>
        {batch.notifications.length === 0 ? <p>{t("payments.noNotifications")}</p> : null}
        {batch.notifications.length > 0 ? (
          <>
            <div className="payment-mobile-cards">
              {batch.notifications.map((notification) => (
                <article className="list-mobile-card" key={notification.id}>
                  <div className="list-mobile-card-header">
                    <h3>{notification.channel}</h3>
                    <span>{notificationStatusLabel(t, notification.status)}</span>
                  </div>
                  <p className="list-mobile-card-meta">{notification.recipient}</p>
                  <p className="batch-review-meta">{notification.message}</p>
                  {notification.errorMessage ? <p className="form-error">{notification.errorMessage}</p> : null}
                </article>
              ))}
            </div>
            <div className="category-table-wrap payment-desktop-table">
              <table className="payment-batch-table">
                <caption className="sr-only">{t("nav.notifications")}</caption>
                <colgroup>
                  <col className="payment-note-channel" />
                  <col className="payment-note-status" />
                  <col className="payment-note-recipient" />
                  <col className="payment-note-when" />
                  <col className="payment-note-message" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t("payments.channel")}</th>
                    <th scope="col">{t("payments.statusLabel")}</th>
                    <th scope="col">{t("payments.recipient")}</th>
                    <th scope="col">{t("payments.sentAt")}</th>
                    <th scope="col">{t("payments.message")}</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td>{notification.channel}</td>
                      <td>{notificationStatusLabel(t, notification.status)}</td>
                      <td>{notification.recipient}</td>
                      <td>{(notification.sentAt ?? notification.createdAt).slice(0, 16).replace("T", " ")}</td>
                      <td>
                        {notification.message}
                        {notification.errorMessage ? <span className="batch-review-meta">{notification.errorMessage}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Card>
      <p>
        <Link className="auth-link" href="/payments">{t("common.back")}</Link>
      </p>
    </div>
  );
}

export function batchStatusClass(status: string) {
  if (status === "paid") {
    return "status-badge status-paid";
  }

  if (status === "cancelled" || status === "failed") {
    return "status-badge status-paused";
  }

  return "status-badge status-pending";
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

export function notificationStatusClass(status: string) {
  if (status === "sent" || status === "delivered") {
    return "status-badge status-paid";
  }

  if (status === "failed" || status === "cancelled") {
    return "status-badge status-paused";
  }

  return "status-badge status-pending";
}

export function notificationErrorLabel(t: (key: string) => string, errorMessage: string | null) {
  if (!errorMessage) {
    return null;
  }

  if (errorMessage === "receipt_send_failed") {
    return t("payments.notificationErrorReceiptNotSent");
  }

  if (errorMessage === "send_failed") {
    return t("payments.notificationErrorSendFailed");
  }

  return errorMessage;
}

function money(amount: number, currency: string, locale: string) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}
