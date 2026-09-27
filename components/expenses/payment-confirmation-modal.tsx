"use client";

import { useState } from "react";
import { needsEvidenceWarning } from "@/lib/payments/rules";
import { EXPENSE_PAYMENT_METHODS, type ExpensePaymentMethod } from "@/lib/expenses/types";
import { useTranslations } from "@/lib/i18n/client";
import { translateEnum } from "@/lib/i18n/translator";

export type PaymentConfirmationResult = {
  paidAt: string;
  paymentMethod: string;
  paymentNote: string;
  receipt: File | null;
  picture: File | null;
};

type PaymentConfirmationModalProps = {
  open: boolean;
  description: string;
  amountLabel: string;
  defaultMethod: string;
  onClose: () => void;
  onConfirm: (result: PaymentConfirmationResult) => void;
};

export function PaymentConfirmationModal({
  open,
  description,
  amountLabel,
  defaultMethod,
  onClose,
  onConfirm,
}: PaymentConfirmationModalProps) {
  const { t } = useTranslations();
  const [paidAt, setPaidAt] = useState(todayInLuanda);
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [paymentNote, setPaymentNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [warn, setWarn] = useState(false);

  if (!open) {
    return null;
  }

  function confirm() {
    if (!warn && needsEvidenceWarning(!receipt, !picture)) {
      setWarn(true);
      return;
    }

    onConfirm({
      paidAt,
      paymentMethod,
      paymentNote: paymentNote.trim(),
      receipt,
      picture,
    });
  }

  return (
    <div className="payment-sheet" role="presentation">
      <form
        aria-labelledby="payment-confirm-title"
        className="payment-sheet-card"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          confirm();
        }}
        role="dialog"
      >
        <div className="payment-sheet-header">
          <h2 id="payment-confirm-title">{t("payments.confirmPayment")}</h2>
          <button className="button button-outline button-small" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <p>{warn ? t("payments.withoutEvidence") : t("payments.markAsPaidQuestion")}</p>
        <dl className="payment-sheet-facts">
          <div>
            <dt>{t("expenses.description")}</dt>
            <dd>{description}</dd>
          </div>
          <div>
            <dt>{t("expenses.paid")}</dt>
            <dd>{amountLabel}</dd>
          </div>
        </dl>
        <label>
          {t("payments.paymentMethod")}
          <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
            <option value="">{t("common.optional")}</option>
            {EXPENSE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {translateEnum(t, "paymentMethod", method as ExpensePaymentMethod)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("payments.paymentDate")}
          <input onChange={(event) => setPaidAt(event.target.value)} required type="date" value={paidAt} />
        </label>
        <div className="payment-sheet-files">
          <span>{t("payments.paymentEvidence")}</span>
          <label className="button button-outline button-small">
            {t("payments.addReceipt")}
            <input
              accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
              hidden
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          <label className="button button-outline button-small">
            {t("payments.addPicture")}
            <input
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              hidden
              onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          {receipt ? <p>{receipt.name}</p> : null}
          {picture ? <p>{picture.name}</p> : null}
        </div>
        <label>
          {t("payments.paymentDescription")}
          <textarea
            maxLength={500}
            onChange={(event) => setPaymentNote(event.target.value)}
            placeholder={t("payments.optionalNote")}
            rows={3}
            value={paymentNote}
          />
        </label>
        <div className="payment-sheet-actions">
          <button
            className="button button-outline button-small"
            onClick={() => {
              if (warn) {
                setWarn(false);
                return;
              }
              onClose();
            }}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button className="button button-small" type="submit">
            {t("payments.confirmPaymentAction")}
          </button>
        </div>
      </form>
    </div>
  );
}

function todayInLuanda() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
