"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { useTranslations } from "@/lib/i18n/client";
import { translateEnum } from "@/lib/i18n/translator";
import { EXPENSE_PAYMENT_METHODS, type ExpensePaymentMethod } from "@/lib/expenses/types";
import type { PaymentBatchPreview } from "@/lib/notifications/composer";
import { selectionCurrency, type BulkExpenseOption } from "@/lib/payments/bulk";
import { WHATSAPP_TEXT_MAX_LENGTH, whatsAppMessageLength } from "@/lib/whatsapp/message";

type BulkSelectionValue = {
  selected: Set<string>;
  toggle: (id: string) => void;
  visibleSelectableIds: string[];
  toggleVisible: () => void;
};

type BatchResult = {
  paymentStatus: "paid" | "unchanged";
  notificationStatus: "sent" | "failed" | "not_attempted";
  error?: string;
};

const BulkSelectionContext = createContext<BulkSelectionValue | null>(null);

export function BulkPaymentProvider({
  visible,
  matching,
  matchingTotal,
  children,
}: {
  visible: BulkExpenseOption[];
  matching: BulkExpenseOption[];
  matchingTotal: number;
  returnTo: string;
  children: ReactNode;
}) {
  const { t, locale } = useTranslations();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const catalog = useMemo(() => {
    const map = new Map<string, BulkExpenseOption>();
    for (const option of [...matching, ...visible]) {
      map.set(option.id, option);
    }
    return map;
  }, [matching, visible]);
  const visibleSelectableIds = visible.filter((option) => option.selectable).map((option) => option.id);
  const selectedOptions = useMemo(() => [...selected].flatMap((id) => {
    const option = catalog.get(id);
    return option ? [option] : [];
  }), [catalog, selected]);
  const reviewIds = useMemo(() => selectedOptions.map((option) => option.id), [selectedOptions]);
  const summary = selectedOptions.length > 0 ? selectionCurrency(selectedOptions) : null;

  function toggle(id: string) {
    const option = catalog.get(id);
    if (!option?.selectable) {
      return;
    }
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleVisible() {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = visibleSelectableIds.every((id) => next.has(id));
      for (const id of visibleSelectableIds) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  }

  function selectMatching() {
    setSelected(new Set(matching.map((option) => option.id)));
  }

  const allVisibleSelected = visibleSelectableIds.length > 0 && visibleSelectableIds.every((id) => selected.has(id));

  return (
    <BulkSelectionContext.Provider value={{ selected, toggle, visibleSelectableIds, toggleVisible }}>
      {visibleSelectableIds.length > 0 ? (
        <div className="bulk-selection-toolbar">
          <button className="button button-outline button-small" onClick={toggleVisible} type="button">
            {allVisibleSelected
              ? t("payments.deselectAll")
              : t("payments.selectAllVisible", { count: visibleSelectableIds.length })}
          </button>
          {matchingTotal > visibleSelectableIds.length ? (
            <button className="button button-outline button-small" onClick={selectMatching} type="button">
              {t("payments.selectAllMatching", { count: Math.min(matchingTotal, matching.length) })}
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
      {selectedOptions.length > 0 && summary ? (
        <div className="bulk-payment-bar" role="region" aria-label={t("payments.selectedCount", { count: selectedOptions.length })}>
          <div>
            <strong>{t("payments.selectedCount", { count: selectedOptions.length })}</strong>
            {summary.ok ? (
              <p>{t("payments.totalLabel")}: {formatMoney(summary.total, summary.currency, locale)}</p>
            ) : (
              <p>{t("payments.mixedCurrency")}</p>
            )}
          </div>
          <div className="bulk-payment-bar-actions">
            <button className="button button-outline button-small" onClick={() => setSelected(new Set())} type="button">
              {t("payments.clearSelection")}
            </button>
            <button className="button button-small" disabled={!summary.ok} onClick={() => setOpen(true)} type="button">
              {t("payments.reviewBatch")}
            </button>
          </div>
        </div>
      ) : null}
      {open && summary?.ok ? (
        <BulkPaymentModal
          expenseIds={reviewIds}
          onClose={() => setOpen(false)}
          onFinished={() => {
            setSelected(new Set());
            setOpen(false);
          }}
        />
      ) : null}
    </BulkSelectionContext.Provider>
  );
}

export function BulkExpenseCheckbox({ id }: { id: string }) {
  const context = useContext(BulkSelectionContext);
  const { t } = useTranslations();

  if (!context) {
    return null;
  }

  const selectable = context.visibleSelectableIds.includes(id) || context.selected.has(id);

  return (
    <input
      aria-label={t("payments.selectExpense")}
      checked={context.selected.has(id)}
      disabled={!selectable && !context.selected.has(id)}
      onChange={() => context.toggle(id)}
      type="checkbox"
    />
  );
}

export function BulkSelectVisibleCheckbox() {
  const context = useContext(BulkSelectionContext);
  const { t } = useTranslations();

  if (!context || context.visibleSelectableIds.length === 0) {
    return null;
  }

  const selectedCount = context.visibleSelectableIds.filter((id) => context.selected.has(id)).length;
  const checked = selectedCount === context.visibleSelectableIds.length;

  return (
    <input
      aria-label={t("payments.selectAllVisible", { count: context.visibleSelectableIds.length })}
      checked={checked}
      onChange={context.toggleVisible}
      ref={(node) => {
        if (node) {
          node.indeterminate = selectedCount > 0 && !checked;
        }
      }}
      type="checkbox"
    />
  );
}

function BulkPaymentModal({
  expenseIds,
  onClose,
  onFinished,
}: {
  expenseIds: string[];
  onClose: () => void;
  onFinished: () => void;
}) {
  const { t, locale } = useTranslations();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [sendKey] = useState(() => crypto.randomUUID());
  const [batch, setBatch] = useState<PaymentBatchPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [paidAt, setPaidAt] = useState(todayInLuanda);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const untouched = useRef(true);
  const extra = (receipt ? 1 : 0) + (picture ? 1 : 0);
  const length = whatsAppMessageLength(message);

  useEffect(() => {
    let cancelled = false;

    async function openBatch() {
      setLoading(true);
      const response = await fetch("/api/payments/batches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expenseIds, idempotencyKey }),
      });
      const payload = await response.json().catch(() => ({ error: "failed" }));

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setError(String(payload.error ?? "failed"));
        setLoading(false);
        return;
      }

      const preview = payload as PaymentBatchPreview;
      setBatch(preview);
      setMessage(preview.message);
      setLoading(false);
    }

    void openBatch();

    return () => {
      cancelled = true;
    };
  }, [expenseIds, idempotencyKey]);

  const paymentId = batch?.paymentId;

  useEffect(() => {
    if (!paymentId || loading) {
      return;
    }

    let cancelled = false;

    async function refreshPreview() {
      const response = await fetch(`/api/payments/batches/${paymentId}?extra=${extra}`);
      const payload = await response.json().catch(() => null);

      if (cancelled || !response.ok || !payload) {
        return;
      }

      const preview = payload as PaymentBatchPreview;
      setBatch(preview);
      if (untouched.current) {
        setMessage(preview.message);
      }
    }

    void refreshPreview();

    return () => {
      cancelled = true;
    };
  }, [extra, paymentId, loading]);

  async function removeExpense(expenseId: string) {
    if (!batch || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    const response = await fetch(`/api/payments/batches/${batch.paymentId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expenseId, extraAttachments: extra }),
    });
    const payload = await response.json().catch(() => ({ error: "failed" }));
    setBusy(false);

    if (!response.ok) {
      setError(String(payload.error ?? "failed"));
      return;
    }

    const preview = payload as PaymentBatchPreview;
    setBatch(preview);
    if (untouched.current) {
      setMessage(preview.message);
    }
  }

  async function closeModal() {
    if (batch && !result && batch.batchStatus === "draft") {
      setBusy(true);
      await fetch(`/api/payments/batches/${batch.paymentId}`, { method: "DELETE" });
      setBusy(false);
    }

    onClose();
  }

  async function submit(action: "notify" | "confirm") {
    if (!batch || busy || batch.expenseCount < 1) {
      return;
    }

    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("phone", phone);
    form.set("message", message);
    form.set("idempotencyKey", sendKey);
    form.set("paid_at", paidAt);
    form.set("payment_method", paymentMethod);
    form.set("payment_note", paymentNote);
    if (receipt) {
      form.set("receipt", receipt);
    }
    if (picture) {
      form.set("picture", picture);
    }

    const response = await fetch(`/api/payments/batches/${batch.paymentId}/${action}`, {
      method: "POST",
      body: form,
    });
    const payload = await response.json().catch(() => ({ error: "failed", paymentStatus: "unchanged", notificationStatus: "failed" }));
    setBusy(false);

    const next: BatchResult = {
      paymentStatus: payload.paymentStatus === "paid" ? "paid" : "unchanged",
      notificationStatus: payload.notificationStatus === "sent" || payload.notificationStatus === "not_attempted" ? payload.notificationStatus : "failed",
      error: payload.error ? String(payload.error) : undefined,
    };

    if (!response.ok && next.paymentStatus !== "paid") {
      setError(next.error ?? "failed");
      return;
    }

    setResult(next);
    if (payload.batchStatus) {
      setBatch({ ...batch, batchStatus: String(payload.batchStatus) });
    }
  }

  const receipts = batch ? batch.attachmentCount : extra;
  const showGap = batch ? batch.attachmentCount !== batch.expenseCount : false;

  return (
    <div className="payment-sheet" role="presentation">
      <div aria-labelledby="bulk-payment-title" className="payment-sheet-card" role="dialog">
        <div className="payment-sheet-header">
          <h2 id="bulk-payment-title">{t("payments.bulkTitle")}</h2>
          <button className="button button-outline button-small" disabled={busy} onClick={() => (result ? onFinished() : void closeModal())} type="button">
            ×
          </button>
        </div>
        {loading ? <p>{t("payments.reviewLoading")}</p> : null}
        {error ? <p className="form-error" role="alert">{batchErrorText(t, error)}</p> : null}
        {batch && !loading ? (
          <>
            <p>{batch.reference}</p>
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
                  <span>{formatMoney(expense.amount, expense.currency, locale)}</span>
                  <button className="button button-outline button-small" disabled={busy || Boolean(result)} onClick={() => void removeExpense(expense.id)} type="button">
                    {t("payments.removeExpense")}
                  </button>
                </li>
              ))}
            </ul>
            <p className="bulk-payment-total">
              {t("payments.totalLabel")}: {formatMoney(batch.total, batch.currency, locale)}
            </p>
            {showGap ? <p>{t("payments.evidenceGap", { expenses: batch.expenseCount, receipts })}</p> : null}
            <label>
              {t("payments.paymentDate")}
              <input disabled={busy || Boolean(result)} onChange={(event) => setPaidAt(event.target.value)} type="date" value={paidAt} />
            </label>
            <label>
              {t("payments.paymentMethod")}
              <select disabled={busy || Boolean(result)} onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                <option value="">{t("common.optional")}</option>
                {EXPENSE_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {translateEnum(t, "paymentMethod", method as ExpensePaymentMethod)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("payments.paymentDescription")}
              <textarea
                disabled={busy || Boolean(result)}
                maxLength={500}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder={t("payments.optionalNote")}
                rows={2}
                value={paymentNote}
              />
            </label>
            <div className="payment-sheet-files">
              <span>{t("payments.paymentEvidence")}</span>
              <label className="button button-outline button-small">
                {t("payments.addReceipt")}
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
                  disabled={busy || Boolean(result)}
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
                  disabled={busy || Boolean(result)}
                  hidden
                  onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
              {receipt ? <p>{receipt.name}</p> : null}
              {picture ? <p>{picture.name}</p> : null}
            </div>
            <label>
              {t("payments.whatsappNumber")}
              <input disabled={busy || result?.notificationStatus === "sent"} onChange={(event) => setPhone(event.target.value)} value={phone} />
            </label>
            <label>
              {t("payments.messagePreview")}
              <textarea
                disabled={busy || result?.notificationStatus === "sent"}
                onChange={(event) => {
                  untouched.current = false;
                  setMessage(event.target.value);
                }}
                rows={8}
                value={message}
              />
            </label>
            <p className="batch-review-meta">{length} / {WHATSAPP_TEXT_MAX_LENGTH}</p>
            {result ? (
              <div role="status">
                {result.paymentStatus === "paid" ? (
                  <p>{t("payments.bulkPaidSuccess", { count: batch.expenseCount, total: formatMoney(batch.total, batch.currency, locale) })}</p>
                ) : (
                  <p>{t("payments.expensesStayUnpaid")}</p>
                )}
                {result.notificationStatus === "sent" ? <p>{t("payments.notificationSent")}</p> : null}
                {result.notificationStatus === "failed" ? <p>{t("payments.notificationFailed")}</p> : null}
                {result.paymentStatus === "paid" && result.notificationStatus === "failed" ? <p>{t("payments.paymentKept")}</p> : null}
                {result.error ? <p className="form-error">{batchErrorText(t, result.error)}</p> : null}
              </div>
            ) : null}
            <div className="payment-sheet-actions batch-review-actions">
              {result?.notificationStatus === "sent" || (result && result.paymentStatus !== "paid" && result.notificationStatus === "failed") ? (
                <button className="button button-small" onClick={onFinished} type="button">
                  {t("common.close")}
                </button>
              ) : null}
              {result?.paymentStatus === "paid" && result.notificationStatus === "failed" ? (
                <button className="button button-small" disabled={busy} onClick={() => void submit("notify")} type="button">
                  {t("payments.retryNotification")}
                </button>
              ) : null}
              {!result ? (
                <>
                  <button className="button button-outline button-small" disabled={busy} onClick={() => void closeModal()} type="button">
                    {t("common.cancel")}
                  </button>
                  <button className="button button-outline button-small" disabled={busy || batch.expenseCount < 1 || length > WHATSAPP_TEXT_MAX_LENGTH} onClick={() => void submit("notify")} type="button">
                    {t("payments.sendNotification")}
                  </button>
                  <button className="button button-small" disabled={busy || batch.expenseCount < 1 || length > WHATSAPP_TEXT_MAX_LENGTH} onClick={() => void submit("confirm")} type="button">
                    {t("payments.sendAndMarkPaid")}
                  </button>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function batchErrorText(t: (key: string, params?: Record<string, string | number>) => string, code: string) {
  if (code === "mixed_currency") return t("payments.mixedCurrency");
  if (code === "selection_changed") return t("payments.selectionChanged");
  if (code === "not_configured") return t("payments.whatsappNotConfigured");
  if (code === "message_too_long") return t("payments.messageTooLong");
  if (code === "message_empty") return t("payments.messageEmpty");
  if (code === "invalid_phone") return t("payments.phoneInvalid");
  if (code === "upload_failed" || code === "invalid_evidence") return t("payments.uploadFailed");
  if (code === "in_progress") return t("payments.inProgress");
  if (code === "not_found" || code === "unauthorized") return t("payments.selectionChanged");
  return t("payments.unableToSend");
}

function formatMoney(amount: number, currency: string, locale: string) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}

function todayInLuanda() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
