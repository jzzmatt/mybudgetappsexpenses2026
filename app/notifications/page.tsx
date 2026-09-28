import Link from "next/link";
import { notificationStatusLabel } from "@/components/payments/payment-batch-detail";
import { AppShell } from "@/components/layout/app-shell";
import { ListPageContent } from "@/components/layout/list-page-content";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { listPaymentNotifications } from "@/lib/payments/history";

export default async function NotificationsPage() {
  const { t, locale } = await getTranslations();
  let loadError: string | undefined;
  let notifications: Awaited<ReturnType<typeof listPaymentNotifications>> = [];

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
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <div className="list-mobile-card-header">
              <h3>{notification.reference ?? notification.channel}</h3>
              <span>{notificationStatusLabel(t, notification.status)}</span>
            </div>
            <p className="list-mobile-card-meta">
              {t("payments.channel")}: {notification.channel}
              {" · "}
              {notification.recipient}
              {notification.amount !== null && notification.currency ? ` · ${money(notification.amount, notification.currency, locale)}` : ""}
              {notification.attachmentCount !== null ? ` · ${t("payments.attachmentCount")}: ${notification.attachmentCount}` : ""}
            </p>
            <p>{notification.message.slice(0, 180)}</p>
            {notification.errorMessage ? <p className="form-error">{notification.errorMessage}</p> : null}
            {notification.paymentId ? <Link className="auth-link" href={`/payments/${notification.paymentId}`}>{t("payments.openBatch")}</Link> : null}
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
