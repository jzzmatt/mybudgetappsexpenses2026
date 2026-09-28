import Link from "next/link";
import {
  notificationErrorLabel,
  notificationStatusClass,
  notificationStatusLabel,
} from "@/components/payments/payment-batch-detail";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { listPaymentNotifications, type PaymentNotificationListItem } from "@/lib/payments/history";

export default async function NotificationsPage() {
  const { t, locale } = await getTranslations();
  let loadError: string | undefined;
  let notifications: PaymentNotificationListItem[] = [];

  try {
    notifications = await listPaymentNotifications();
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("payments.noNotifications");
  }

  return (
    <AppShell description={t("payments.notificationsDescription")} title={t("payments.notificationsTitle")}>
      {loadError ? <p className="form-error page-error" role="alert">{loadError}</p> : null}
      <ListPageContent>
        {notifications.length === 0 && !loadError ? (
          <Card className="list-empty-card">
            <h2>{t("payments.noNotifications")}</h2>
          </Card>
        ) : null}
        {notifications.length > 0 ? (
          <>
            <div className="notification-mobile-cards">
              {notifications.map((notification) => (
                <NotificationMobileCard key={notification.id} locale={locale} notification={notification} t={t} />
              ))}
            </div>
            <Card className="category-table-card notification-desktop-table">
              <div className="category-table-wrap">
                <table className="payment-batch-table notification-list-table">
                  <caption className="sr-only">{t("payments.notificationsTitle")}</caption>
                  <colgroup>
                    <col className="notification-col-reference" />
                    <col className="notification-col-status" />
                    <col className="notification-col-recipient" />
                    <col className="notification-col-total" />
                    <col className="notification-col-receipts" />
                    <col className="notification-col-when" />
                    <col className="notification-col-message" />
                    <col className="notification-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{t("expenses.paymentReference")}</th>
                      <th scope="col">{t("payments.statusLabel")}</th>
                      <th scope="col">{t("payments.recipient")}</th>
                      <th scope="col">{t("payments.totalLabel")}</th>
                      <th scope="col">{t("payments.attachmentCount")}</th>
                      <th scope="col">{t("payments.sentAt")}</th>
                      <th scope="col">{t("payments.message")}</th>
                      <th scope="col">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification) => (
                      <tr key={notification.id}>
                        <th scope="row">{notification.reference ?? t("common.dash")}</th>
                        <td>
                          <span className={notificationStatusClass(notification.status)}>
                            {notificationStatusLabel(t, notification.status)}
                          </span>
                        </td>
                        <td>{notification.recipient}</td>
                        <td>{formatAmount(notification, locale, t)}</td>
                        <td>{notification.attachmentCount ?? t("common.dash")}</td>
                        <td>{formatWhen(notification)}</td>
                        <td>
                          <NotificationMessage message={notification.message} />
                          <NotificationError error={notificationErrorLabel(t, notification.errorMessage)} label={t("payments.failureReason")} />
                        </td>
                        <td>
                          {notification.paymentId ? (
                            <Link className="auth-link" href={`/payments/${notification.paymentId}`}>{t("payments.openBatch")}</Link>
                          ) : (
                            t("common.dash")
                          )}
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

function NotificationMobileCard({
  notification,
  t,
  locale,
}: {
  notification: PaymentNotificationListItem;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}) {
  const error = notificationErrorLabel(t, notification.errorMessage);

  return (
    <Card className="list-mobile-card notification-list-card">
      <div className="list-mobile-card-header">
        <h3>{notification.reference ?? notification.channel}</h3>
        <span className={notificationStatusClass(notification.status)}>{notificationStatusLabel(t, notification.status)}</span>
      </div>
      <dl className="list-mobile-card-details">
        <div>
          <dt>{t("payments.channel")}</dt>
          <dd>{notification.channel}</dd>
        </div>
        <div>
          <dt>{t("payments.recipient")}</dt>
          <dd>{notification.recipient}</dd>
        </div>
        <div>
          <dt>{t("payments.totalLabel")}</dt>
          <dd>{formatAmount(notification, locale, t)}</dd>
        </div>
        <div>
          <dt>{t("payments.attachmentCount")}</dt>
          <dd>{notification.attachmentCount ?? t("common.dash")}</dd>
        </div>
        <div>
          <dt>{t("payments.sentAt")}</dt>
          <dd>{formatWhen(notification)}</dd>
        </div>
        {notification.expenseCount !== null ? (
          <div>
            <dt>{t("nav.expenses")}</dt>
            <dd>{notification.expenseCount}</dd>
          </div>
        ) : null}
      </dl>
      <div className="notification-message-block">
        <p className="notification-message-label">{t("payments.message")}</p>
        <NotificationMessage message={notification.message} />
      </div>
      <NotificationError error={error} label={t("payments.failureReason")} />
      {notification.paymentId ? (
        <Link className="button button-outline button-small" href={`/payments/${notification.paymentId}`}>{t("payments.openBatch")}</Link>
      ) : null}
    </Card>
  );
}

function NotificationMessage({ message }: { message: string }) {
  return <pre className="notification-message-preview">{message}</pre>;
}

function NotificationError({ error, label }: { error: string | null; label: string }) {
  if (!error) {
    return null;
  }

  return (
    <p className="notification-error" role="alert">
      <span className="notification-error-label">{label}</span>
      {error}
    </p>
  );
}

function formatWhen(notification: PaymentNotificationListItem) {
  return (notification.sentAt ?? notification.createdAt).slice(0, 16).replace("T", " ");
}

function formatAmount(
  notification: PaymentNotificationListItem,
  locale: string,
  t: (key: string) => string,
) {
  if (notification.amount === null || !notification.currency) {
    return t("common.dash");
  }

  return money(notification.amount, notification.currency, locale);
}

function money(amount: number, currency: string, locale: string) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}
