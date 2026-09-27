"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/client";
import { generatePaidExpenseWhatsAppMessage } from "@/lib/whatsapp/message";

type WhatsAppShareButtonProps = {
  expenseId: string;
  description: string;
  amountLabel: string;
  paymentDateLabel: string;
  paymentMethodLabel: string;
  categoryName: string;
  projectName: string;
  evidenceNames: string[];
};

export function WhatsAppShareButton(props: WhatsAppShareButtonProps) {
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("+");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ recipient: string; sentAt: string } | null>(null);
  const preview = generatePaidExpenseWhatsAppMessage({
    description: props.description,
    amountLabel: props.amountLabel,
    paymentDateLabel: props.paymentDateLabel,
    paymentMethodLabel: props.paymentMethodLabel,
    categoryName: props.categoryName,
    projectName: props.projectName,
    locale,
  });

  async function send() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses/${props.expenseId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = (await response.json()) as { error?: string; recipient?: string; sentAt?: string };

      if (!response.ok) {
        if (payload.error === "invalid_phone") {
          setError(t("payments.phoneInvalid"));
        } else if (payload.error === "not_configured") {
          setError(t("payments.whatsappNotConfigured"));
        } else {
          setError(t("payments.unableToSend"));
        }
        return;
      }

      setSent({
        recipient: payload.recipient ?? phone,
        sentAt: payload.sentAt ?? new Date().toISOString(),
      });
    } catch {
      setError(t("payments.unableToSend"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        aria-label={t("payments.sharePaidExpense")}
        className="button button-outline button-small"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSent(null);
        }}
        type="button"
      >
        {t("payments.shareViaWhatsApp")}
      </button>
      {open ? (
        <div className="payment-sheet" role="presentation">
          <div aria-labelledby="whatsapp-share-title" className="payment-sheet-card" role="dialog">
            <div className="payment-sheet-header">
              <h2 id="whatsapp-share-title">{t("payments.sharePaidExpense")}</h2>
              <button className="button button-outline button-small" onClick={() => setOpen(false)} type="button">
                ×
              </button>
            </div>
            <dl className="payment-sheet-facts">
              <div>
                <dt>{t("expenses.description")}</dt>
                <dd>{props.description}</dd>
              </div>
              <div>
                <dt>{t("expenses.paid")}</dt>
                <dd>{props.amountLabel}</dd>
              </div>
              <div>
                <dt>{t("payments.paymentMethod")}</dt>
                <dd>{props.paymentMethodLabel}</dd>
              </div>
              <div>
                <dt>{t("payments.paymentDate")}</dt>
                <dd>{props.paymentDateLabel}</dd>
              </div>
              {props.evidenceNames.length > 0 ? (
                <div>
                  <dt>{t("payments.paymentEvidence")}</dt>
                  <dd>{props.evidenceNames.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
            <label>
              {t("payments.whatsappNumber")}
              <input onChange={(event) => setPhone(event.target.value)} placeholder="+244 …" value={phone} />
            </label>
            <label>
              {t("payments.messagePreview")}
              <textarea readOnly rows={8} value={preview} />
            </label>
            {sent ? (
              <p className="payment-sheet-success" role="status">
                ✓ {t("payments.paymentInformationSent")}
                <br />
                {t("payments.recipient")}: {sent.recipient}
                <br />
                {t("payments.sentAt")}: {sent.sentAt.slice(0, 16).replace("T", " ")}
              </p>
            ) : null}
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="payment-sheet-actions">
              <button className="button button-outline button-small" onClick={() => setOpen(false)} type="button">
                {t("common.cancel")}
              </button>
              <button className="button button-small" disabled={pending || Boolean(sent)} onClick={() => void send()} type="button">
                {t("payments.sendViaWhatsApp")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
