"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { markExpensesPaidAction } from "@/lib/expenses/actions";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { useTranslations } from "@/lib/i18n/client";
import { translateEnum } from "@/lib/i18n/translator";
import { EXPENSE_PAYMENT_METHODS, type ExpensePaymentMethod } from "@/lib/expenses/types";
import { selectionCurrency, type BulkExpenseOption } from "@/lib/payments/bulk";
import { needsEvidenceWarning } from "@/lib/payments/rules";

const PREVIEW_COUNT = 8;

type BulkSelectionValue = {
  selected: Set<string>;
  toggle: (id: string) => void;
  visibleSelectableIds: string[];
  toggleVisible: () => void;
};

const BulkSelectionContext = createContext<BulkSelectionValue | null>(null);

export function BulkPaymentProvider({
  visible,
  matching,
  matchingTotal,
  returnTo,
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
  const selectedOptions = [...selected].flatMap((id) => {
    const option = catalog.get(id);
    return option ? [option] : [];
  });
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
              {t("payments.markAsPaid")}
            </button>
          </div>
        </div>
      ) : null}
      {open && summary?.ok ? (
        <BulkPaymentModal
          onClose={() => setOpen(false)}
          options={selectedOptions}
          returnTo={returnTo}
          totalLabel={formatMoney(summary.total, summary.currency, locale)}
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
  options,
  totalLabel,
  returnTo,
  onClose,
}: {
  options: BulkExpenseOption[];
  totalLabel: string;
  returnTo: string;
  onClose: () => void;
}) {
  const { t, locale } = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const [paidAt, setPaidAt] = useState(todayInLuanda);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [picture, setPicture] = useState<File | null>(null);
  const [warn, setWarn] = useState(false);
  const shown = expanded ? options : options.slice(0, PREVIEW_COUNT);
  const hidden = options.length - shown.length;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (!warn && needsEvidenceWarning(!receipt, !picture)) {
      event.preventDefault();
      setWarn(true);
    }
  }

  return (
    <div className="payment-sheet" role="presentation">
      <form action={markExpensesPaidAction} aria-labelledby="bulk-payment-title" className="payment-sheet-card" onSubmit={submit} role="dialog">
        <div className="payment-sheet-header">
          <h2 id="bulk-payment-title">{t("payments.bulkTitle")}</h2>
          <button className="button button-outline button-small" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <p>{warn ? t("payments.withoutEvidence") : t("payments.selectedExpenses")}</p>
        <ul className="bulk-payment-lines">
          {shown.map((option) => (
            <li key={option.id}>
              <span>{option.description}</span>
              <span>{formatMoney(option.amount, option.currency, locale)}</span>
            </li>
          ))}
        </ul>
        {hidden > 0 ? (
          <button className="button button-outline button-small" onClick={() => setExpanded(true)} type="button">
            {t("payments.andMore", { count: hidden })}
          </button>
        ) : null}
        <p className="bulk-payment-total">
          {t("payments.totalLabel")}: {totalLabel}
        </p>
        <input name="return_to" type="hidden" value={returnTo} />
        {options.map((option) => (
          <input key={option.id} name="expense_id" type="hidden" value={option.id} />
        ))}
        <label>
          {t("payments.paymentDate")}
          <input name="paid_at" onChange={(event) => setPaidAt(event.target.value)} required type="date" value={paidAt} />
        </label>
        <label>
          {t("payments.paymentMethod")}
          <select name="payment_method" onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
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
            maxLength={500}
            name="payment_note"
            onChange={(event) => setPaymentNote(event.target.value)}
            placeholder={t("payments.optionalNote")}
            rows={3}
            value={paymentNote}
          />
        </label>
        <div className="payment-sheet-files">
          <span>{t("payments.paymentEvidence")}</span>
          <label className="button button-outline button-small">
            {t("payments.addReceipt")}
            <input
              accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
              hidden
              name="receipt"
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
              name="picture"
              onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          {receipt ? <p>{receipt.name}</p> : null}
          {picture ? <p>{picture.name}</p> : null}
        </div>
        <div className="payment-sheet-actions">
          <button className="button button-outline button-small" onClick={onClose} type="button">
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
