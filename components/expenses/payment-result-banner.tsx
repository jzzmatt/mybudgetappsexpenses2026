import { WhatsAppShareButton } from "@/components/expenses/whatsapp-share-button";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import { getPaymentShareView } from "@/lib/payments/queries";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { formatWhatsAppDate, generateBulkPaidExpenseWhatsAppTemplate } from "@/lib/whatsapp/message";
import type { ExpensePaymentMethod } from "@/lib/expenses/types";

export async function PaymentResultBanner({
  paid,
  paymentId,
}: {
  paid: boolean;
  paymentId?: string;
}) {
  const { t, locale } = await getTranslations();

  if (paymentId) {
    let userId = "";

    try {
      userId = await ensureUserRecord();
    } catch {
      userId = "";
    }

    const payment = userId ? await getPaymentShareView(userId, paymentId) : null;

    if (payment && payment.expenses.length > 1) {
      const currency = isExpenseCurrency(payment.currency) ? payment.currency : "KZ";
      const totalLabel = formatCurrency(payment.amount, currency, locale);
      const projectNames = [...new Set(payment.expenses.map((expense) => expense.projectName).filter(Boolean))];
      const categoryNames = [...new Set(payment.expenses.map((expense) => expense.categoryName).filter(Boolean))];
      const template = generateBulkPaidExpenseWhatsAppTemplate({
        locale,
        totalLabel,
        paymentDateLabel: formatWhatsAppDate(payment.paymentDate),
        paymentMethodLabel: payment.paymentMethod ? translateEnum(t, "paymentMethod", payment.paymentMethod as ExpensePaymentMethod) : "—",
        projectName: projectNames.length === 1 ? projectNames[0] : null,
        categoryName: categoryNames.length === 1 ? categoryNames[0] : null,
        expenses: payment.expenses.map((expense) => ({
          description: expense.description,
          amountLabel: formatCurrency(expense.amount, isExpenseCurrency(expense.currency) ? expense.currency : currency, locale),
        })),
      });

      return (
        <div className="payment-result-banner" role="status">
          <p className="payment-sheet-success">
            ✓ {t("payments.bulkPaidSuccess", { count: payment.expenses.length, total: totalLabel })}
          </p>
          <WhatsAppShareButton
            amountLabel={totalLabel}
            categoryName={categoryNames.length === 1 ? categoryNames[0] : "—"}
            description={payment.description ?? t("payments.bulkTitle")}
            evidenceNames={[]}
            expenseCount={payment.expenses.length}
            initialMessage={template.message}
            paymentDateLabel={formatWhatsAppDate(payment.paymentDate)}
            paymentId={payment.id}
            paymentMethodLabel={payment.paymentMethod ? translateEnum(t, "paymentMethod", payment.paymentMethod as ExpensePaymentMethod) : "—"}
            projectName={projectNames.length === 1 ? projectNames[0] : "—"}
          />
        </div>
      );
    }
  }

  if (!paid) {
    return null;
  }

  return (
    <p className="payment-sheet-success" role="status">
      ✓ {t("payments.paidSuccess")}
    </p>
  );
}
