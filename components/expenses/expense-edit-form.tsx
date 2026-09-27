"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { PaymentConfirmationModal, type PaymentConfirmationResult } from "@/components/expenses/payment-confirmation-modal";
import { WhatsAppShareButton } from "@/components/expenses/whatsapp-share-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY } from "@/lib/currency/types";
import { removePaymentEvidenceAction, updateExpenseAction } from "@/lib/expenses/actions";
import { shouldConfirmPayment, canSharePaidExpense } from "@/lib/payments/rules";
import { formatWhatsAppDate, shareAmount } from "@/lib/whatsapp/message";
import { formatCurrency } from "@/lib/expenses/format";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
  type ExpenseWithRelations,
} from "@/lib/expenses/types";
import { useTranslations } from "@/lib/i18n/client";
import { translateEnum } from "@/lib/i18n/translator";
import { willCauseProjectOverspending } from "@/lib/projects/calculations";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseEditFormProps = {
  expense: ExpenseWithRelations;
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
};

export function ExpenseEditForm({ expense, categories, projects, vendors }: ExpenseEditFormProps) {
  const { t, locale } = useTranslations();
  const updateExpense = updateExpenseAction.bind(null, expense.id);
  const formRef = useRef<HTMLFormElement>(null);
  const paidAtRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const confirmedRef = useRef<HTMLInputElement>(null);
  const methodRef = useRef<HTMLSelectElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(expense.project_id || "");
  const [budgetAmount, setBudgetAmount] = useState<number>(Number(expense.budget_amount) || 0);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const inheritedCurrency = selectedProject?.currency || expense.currency || DEFAULT_EXPENSE_CURRENCY;
  const projectBudget = selectedProject?.budget_amount || 0;

  const overspendWarning =
    projectBudget > 0 && budgetAmount > 0
      ? willCauseProjectOverspending(projectBudget, 0, budgetAmount)
      : null;

  const amountLabel = formatCurrency(
    shareAmount(Number(expense.paid_amount), Number(expense.budget_amount)),
    inheritedCurrency,
    locale,
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const status = String(new FormData(event.currentTarget).get("status") ?? "");

    if (shouldConfirmPayment(expense.status, status) && confirmedRef.current?.value !== "1") {
      event.preventDefault();
      setConfirmOpen(true);
    }
  }

  function confirmPayment(result: PaymentConfirmationResult) {
    if (paidAtRef.current) {
      paidAtRef.current.value = result.paidAt;
    }
    if (noteRef.current) {
      noteRef.current.value = result.paymentNote;
    }
    if (confirmedRef.current) {
      confirmedRef.current.value = "1";
    }
    if (methodRef.current) {
      methodRef.current.value = result.paymentMethod;
    }
    assignFile(receiptRef.current, result.receipt);
    assignFile(pictureRef.current, result.picture);
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <Card className="category-form-card expense-form-card">
      {canSharePaidExpense(expense.status) ? (
        <div className="payment-paid-summary">
          <p>
            ✓ {t("payments.paid")}
            {expense.paid_at ? ` · ${t("payments.paymentDate")}: ${formatWhatsAppDate(expense.paid_at)}` : ""}
          </p>
          {expense.payment_note ? <p>{expense.payment_note}</p> : null}
          <WhatsAppShareButton
            amountLabel={amountLabel}
            categoryName={expense.category?.name ?? "—"}
            description={expense.description}
            evidenceNames={[
              ...(expense.payment_proof_filename ? [expense.payment_proof_filename] : []),
              ...(expense.evidence?.map((item) => item.fileName) ?? []),
            ]}
            expenseId={expense.id}
            paymentDateLabel={formatWhatsAppDate(expense.paid_at ?? "")}
            paymentMethodLabel={expense.payment_method ? translateEnum(t, "paymentMethod", expense.payment_method) : "—"}
            projectName={expense.project?.name ?? "—"}
          />
          {expense.evidence && expense.evidence.length > 0 ? (
            <ul className="payment-evidence-list">
              {expense.evidence.map((item) => (
                <li key={item.id}>
                  <span>
                    📎 {item.fileName}
                  </span>
                  {item.signedUrl ? (
                    <a className="button button-outline button-small" href={item.signedUrl} rel="noopener noreferrer" target="_blank">
                      {t("payments.viewEvidence")}
                    </a>
                  ) : null}
                  <form action={removePaymentEvidenceAction.bind(null, item.id)}>
                    <button className="button button-outline button-small" type="submit">
                      {t("payments.removeEvidence")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <form action={updateExpense} className="category-form" onSubmit={onSubmit} ref={formRef}>
        <input defaultValue="" name="payment_confirmed" ref={confirmedRef} type="hidden" />
        <input name="confirm_paid_at" ref={paidAtRef} type="hidden" />
        <input name="confirm_payment_note" ref={noteRef} type="hidden" />
        <input name="receipt" ref={receiptRef} type="file" hidden />
        <input name="picture" ref={pictureRef} type="file" hidden />
        <label className="auth-field" htmlFor="expense-project">
          <span>{t("expenses.project")}</span>
          <select
            id="expense-project"
            name="project_id"
            onChange={(e) => setSelectedProjectId(e.target.value)}
            required
            value={selectedProjectId}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.currency})
              </option>
            ))}
          </select>
        </label>

        <AuthField
          defaultValue={expense.date}
          id="expense-date"
          label={t("expenses.date")}
          name="date"
          required
          type="date"
        />

        <AuthField
          autoComplete="off"
          defaultValue={expense.description}
          id="expense-description"
          label={t("expenses.description")}
          name="description"
          placeholder="e.g. Cloud infrastructure"
          required
        />

        <label className="auth-field" htmlFor="expense-category">
          <span>{t("expenses.category")}</span>
          <select
            defaultValue={expense.category_id ?? ""}
            id="expense-category"
            name="category_id"
          >
            <option value="">{t("common.uncategorized")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field" htmlFor="expense-vendor">
          <span>{t("expenses.vendor")}</span>
          <select defaultValue={expense.vendor_id ?? ""} id="expense-vendor" name="vendor_id">
            <option value="">{t("expenses.allVendors")}</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>

        <div className="auth-field">
          <span>{t("expenses.currencyInherited", { currency: inheritedCurrency })}</span>
          <div className="expense-currency-display">
            <strong>{CURRENCY_LABELS[inheritedCurrency]}</strong>
            <input name="currency" type="hidden" value={inheritedCurrency} />
          </div>
        </div>

        <AuthField
          defaultValue={String(expense.budget_amount)}
          id="expense-budget"
          inputMode="decimal"
          label={t("expenses.expenseBudget")}
          min="0"
          name="budget_amount"
          onChange={(e) => setBudgetAmount(Number(e.target.value) || 0)}
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />

        {overspendWarning?.isOverspent ? (
          <div className="expense-overspend-warning" role="alert">
            {t("expenses.overspendWarningTitle")}:{" "}
            {t("expenses.overspendWarning", {
              amount: formatCurrency(budgetAmount, inheritedCurrency, locale),
            })}
          </div>
        ) : null}

        <AuthField
          defaultValue={String(expense.paid_amount)}
          id="expense-paid"
          inputMode="decimal"
          label={t("expenses.paid")}
          min="0"
          name="paid_amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />

        <label className="auth-field" htmlFor="expense-payment-method">
          <span>{t("expenses.paymentMethod")}</span>
          <select
            defaultValue={expense.payment_method ?? ""}
            id="expense-payment-method"
            name="payment_method"
            ref={methodRef}
          >
            <option value="">{t("common.optional")}</option>
            {EXPENSE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {translateEnum(t, "paymentMethod", method)}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field" htmlFor="expense-priority">
          <span>{t("expenses.priority")}</span>
          <select defaultValue={expense.priority ?? ""} id="expense-priority" name="priority">
            <option value="">{t("common.optional")}</option>
            {EXPENSE_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {translateEnum(t, "priority", priority)}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field" htmlFor="expense-status">
          <span>{t("expenses.status")}</span>
          <select defaultValue={expense.status} id="expense-status" name="status" required>
            {EXPENSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {translateEnum(t, "status", status)}
              </option>
            ))}
          </select>
        </label>

        {expense.status === "paid" ? (
          <>
            <label className="auth-field" htmlFor="expense-paid-at">
              <span>{t("payments.paymentDate")}</span>
              <input defaultValue={expense.paid_at ?? ""} id="expense-paid-at" name="paid_at" type="date" />
            </label>
            <label className="auth-field" htmlFor="expense-payment-note">
              <span>{t("payments.paymentDescription")}</span>
              <textarea defaultValue={expense.payment_note ?? ""} id="expense-payment-note" maxLength={500} name="payment_note" rows={3} />
            </label>
          </>
        ) : null}

        <label className="auth-field" htmlFor="expense-notes">
          <span>{t("expenses.notes")}</span>
          <textarea
            defaultValue={expense.notes ?? ""}
            id="expense-notes"
            name="notes"
            placeholder={t("common.optional")}
            rows={4}
          />
        </label>

        <AuthField
          autoComplete="off"
          defaultValue={expense.payment_reference ?? ""}
          id="expense-payment-reference"
          label={t("expenses.paymentReference")}
          name="payment_reference"
          placeholder="e.g. TRX-938218 / 32305151"
        />

        {expense.payment_proof_path ? (
          <div className="auth-field">
            <span>{t("common.proofAttached")}</span>
            <div className="expense-proof-preview-box">
              <span>📄 {expense.payment_proof_filename || "payment-proof.pdf"}</span>
              {expense.proofSignedUrl ? (
                <a
                  className="button button-outline button-small"
                  href={expense.proofSignedUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t("common.viewPdf")}
                </a>
              ) : null}
            </div>
            <input name="payment_proof_path" type="hidden" value={expense.payment_proof_path} />
            <input name="payment_proof_filename" type="hidden" value={expense.payment_proof_filename ?? ""} />
          </div>
        ) : null}

        <div className="category-form-actions">
          <Button type="submit">{t("common.save")}</Button>
          <CopyExpenseButton expense={expense} />
          <Link
            className="auth-link"
            href={expense.project_id ? `/projects/${expense.project_id}/expenses` : "/expenses"}
          >
            {t("common.cancel")}
          </Link>
        </div>
      </form>
      <PaymentConfirmationModal
        amountLabel={amountLabel}
        defaultMethod={expense.payment_method ?? ""}
        description={expense.description}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmPayment}
        open={confirmOpen}
      />
    </Card>
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
