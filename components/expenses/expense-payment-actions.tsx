"use client";

import { useRef, useState } from "react";
import { PaymentConfirmationModal, type PaymentConfirmationResult } from "@/components/expenses/payment-confirmation-modal";
import { WhatsAppShareButton } from "@/components/expenses/whatsapp-share-button";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { markExpensePaidAction } from "@/lib/expenses/actions";
import { canSharePaidExpense, shouldConfirmPayment } from "@/lib/payments/rules";
import type { ExpenseWithRelations } from "@/lib/expenses/types";
import { useTranslations } from "@/lib/i18n/client";
import { translateEnum } from "@/lib/i18n/translator";
import { formatWhatsAppDate, shareAmount } from "@/lib/whatsapp/message";

export function ExpensePaymentActions({
  expense,
  returnTo,
}: {
  expense: ExpenseWithRelations;
  returnTo: string;
}) {
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const paidAtRef = useRef<HTMLInputElement>(null);
  const methodRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const currency = isExpenseCurrency(expense.currency) ? expense.currency : "KZ";
  const amountLabel = formatCurrency(shareAmount(Number(expense.paid_amount), Number(expense.budget_amount)), currency, locale);
  const evidenceNames = [
    ...(expense.payment_proof_filename ? [expense.payment_proof_filename] : []),
    ...(expense.evidence?.map((item) => item.fileName) ?? []),
  ];

  function confirm(result: PaymentConfirmationResult) {
    if (paidAtRef.current) {
      paidAtRef.current.value = result.paidAt;
    }
    if (methodRef.current) {
      methodRef.current.value = result.paymentMethod;
    }
    if (noteRef.current) {
      noteRef.current.value = result.paymentNote;
    }
    assignFile(receiptRef.current, result.receipt);
    assignFile(pictureRef.current, result.picture);
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <div className="expense-payment-actions">
      {(expense.evidenceCount ?? 0) > 0 ? (
        <span aria-label={t("payments.paymentEvidence")} className="expense-proof-indicator" title={t("payments.paymentEvidence")}>
          📎
        </span>
      ) : null}
      {canSharePaidExpense(expense.status) ? (
        <WhatsAppShareButton
          amountLabel={amountLabel}
          categoryName={expense.category?.name ?? "—"}
          description={expense.description}
          evidenceNames={evidenceNames}
          expenseId={expense.id}
          paymentDateLabel={formatWhatsAppDate(expense.paid_at ?? "")}
          paymentMethodLabel={expense.payment_method ? translateEnum(t, "paymentMethod", expense.payment_method) : "—"}
          projectName={expense.project?.name ?? "—"}
        />
      ) : null}
      {shouldConfirmPayment(expense.status, "paid") ? (
        <button className="button button-outline button-small" onClick={() => setOpen(true)} type="button">
          {t("payments.markAsPaid")}
        </button>
      ) : null}
      <form action={markExpensePaidAction.bind(null, expense.id)} className="sr-only" ref={formRef}>
        <input name="return_to" type="hidden" value={returnTo} />
        <input name="paid_at" ref={paidAtRef} type="hidden" />
        <input name="payment_method" ref={methodRef} type="hidden" />
        <input name="payment_note" ref={noteRef} type="hidden" />
        <input name="receipt" ref={receiptRef} type="file" />
        <input name="picture" ref={pictureRef} type="file" />
      </form>
      <PaymentConfirmationModal
        amountLabel={amountLabel}
        defaultMethod={expense.payment_method ?? ""}
        description={expense.description}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        open={open}
      />
    </div>
  );
}

function assignFile(input: HTMLInputElement | null, file: File | null) {
  if (!input) {
    return;
  }

  const transfer = new DataTransfer();

  if (file) {
    transfer.items.add(file);
  }

  input.files = transfer.files;
}
