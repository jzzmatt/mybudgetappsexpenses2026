"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/client";
import {
  generatePaidExpenseWhatsAppTemplate,
  prepareOutboundWhatsAppMessage,
  WHATSAPP_TEXT_MAX_LENGTH,
  whatsAppMessageLength,
} from "@/lib/whatsapp/message";

type WhatsAppShareButtonProps = {
  expenseId?: string;
  paymentId?: string;
  initialMessage?: string;
  expenseCount?: number;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("+");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ recipient: string; sentAt: string; attachmentCount: number } | null>(null);
  const [receiptsOnly, setReceiptsOnly] = useState(false);
  const [textSentWithoutReceipt, setTextSentWithoutReceipt] = useState(false);
  const [message, setMessage] = useState("");
  const messageLength = whatsAppMessageLength(message);
  const outbound = prepareOutboundWhatsAppMessage(message);

  function openShare() {
    setMessage(
      props.initialMessage ??
        generatePaidExpenseWhatsAppTemplate({
          description: props.description,
          amountLabel: props.amountLabel,
          paymentDateLabel: props.paymentDateLabel,
          paymentMethodLabel: props.paymentMethodLabel,
          categoryName: props.categoryName,
          projectName: props.projectName,
          locale,
        }).message,
    );
    setOpen(true);
    setError(null);
    setSent(null);
    setReceiptsOnly(false);
    setTextSentWithoutReceipt(false);
  }

  async function send() {
    if (!outbound.ok) {
      setError(outbound.error === "too_long" ? t("payments.messageTooLong") : t("payments.messageEmpty"));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const endpoint = props.paymentId ? `/api/payments/${props.paymentId}/whatsapp` : `/api/expenses/${props.expenseId}/whatsapp`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: outbound.message, receiptsOnly }),
      });
      const payload = (await response.json()) as {
        error?: string;
        textSent?: boolean;
        recipient?: string;
        sentAt?: string;
        attachmentCount?: number;
        attachmentsSent?: number;
      };

      if (!response.ok) {
        if (payload.error === "receipt_send_failed" && payload.textSent) {
          setTextSentWithoutReceipt(true);
          setReceiptsOnly(true);
          setError(t("payments.receiptSendFailedTextSent"));
          return;
        }

        if (payload.error === "invalid_phone") {
          setError(t("payments.phoneInvalid"));
        } else if (payload.error === "not_configured") {
          setError(t("payments.whatsappNotConfigured"));
        } else if (payload.error === "message_too_long") {
          setError(t("payments.messageTooLong"));
        } else if (payload.error === "message_empty") {
          setError(t("payments.messageEmpty"));
        } else {
          setError(t("payments.unableToSend"));
        }
        return;
      }

      setSent({
        recipient: payload.recipient ?? phone,
        sentAt: payload.sentAt ?? new Date().toISOString(),
        attachmentCount: payload.attachmentsSent ?? payload.attachmentCount ?? 0,
      });
      router.refresh();
    } catch {
      setError(t("payments.unableToSend"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        aria-label={(props.expenseCount ?? 0) > 1 ? t("payments.shareBulkPayment") : t("payments.sharePaidExpense")}
        className="button button-outline button-small"
        onClick={openShare}
        type="button"
      >
        {t("payments.shareViaWhatsApp")}
      </button>
      {open ? (
        <div className="payment-sheet" role="presentation">
          <div aria-labelledby="whatsapp-share-title" className="payment-sheet-card" role="dialog">
            <div className="payment-sheet-header">
              <h2 id="whatsapp-share-title">{(props.expenseCount ?? 0) > 1 ? t("payments.shareBulkPayment") : t("payments.sharePaidExpense")}</h2>
              <button className="button button-outline button-small" onClick={() => setOpen(false)} type="button">
                ×
              </button>
            </div>
            <dl className="payment-sheet-facts">
              {(props.expenseCount ?? 0) > 1 ? (
                <div>
                  <dt>{t("payments.selectedExpenses")}</dt>
                  <dd>{t("payments.selectedCount", { count: props.expenseCount ?? 0 })}</dd>
                </div>
              ) : (
                <div>
                  <dt>{t("expenses.description")}</dt>
                  <dd>{props.description}</dd>
                </div>
              )}
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
              {t("payments.message")}
              <textarea onChange={(event) => setMessage(event.target.value)} rows={10} value={message} />
            </label>
            <p className="whatsapp-message-count">
              {messageLength} / {WHATSAPP_TEXT_MAX_LENGTH}
            </p>
            {!outbound.ok ? (
              <p className="form-error" role="alert">
                {outbound.error === "too_long" ? t("payments.messageTooLong") : t("payments.messageEmpty")}
              </p>
            ) : null}
            <div>
              <p className="whatsapp-preview-label">{t("payments.messagePreview")}</p>
              <pre className="whatsapp-message-preview">{message}</pre>
            </div>
            {textSentWithoutReceipt ? (
              <p className="payment-sheet-success payment-sheet-success-animate" role="status">
                <span aria-hidden="true" className="whatsapp-send-check">✓</span> {t("payments.paymentInformationSent")}
              </p>
            ) : null}
            {sent ? (
              <p className="payment-sheet-success payment-sheet-success-animate" role="status">
                <span aria-hidden="true" className="whatsapp-send-check">✓</span> {receiptsOnly ? t("payments.receiptsSentViaWhatsApp", { count: sent.attachmentCount }) : t("payments.paymentInformationSent")}
                {!receiptsOnly && sent.attachmentCount > 0 ? (
                  <>
                    <br />
                    {t("payments.receiptsSentViaWhatsApp", { count: sent.attachmentCount })}
                  </>
                ) : null}
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
              <button className="button button-small" disabled={pending || (Boolean(sent) && !receiptsOnly) || (!receiptsOnly && !outbound.ok)} onClick={() => void send()} type="button">
                {receiptsOnly ? t("payments.sendReceiptsOnly") : t("payments.sendViaWhatsApp")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
