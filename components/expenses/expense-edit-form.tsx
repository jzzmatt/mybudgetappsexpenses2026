"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY } from "@/lib/currency/types";
import { updateExpenseAction } from "@/lib/expenses/actions";
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

  const [selectedProjectId, setSelectedProjectId] = useState<string>(expense.project_id || "");
  const [budgetAmount, setBudgetAmount] = useState<number>(Number(expense.budget_amount) || 0);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const inheritedCurrency = selectedProject?.currency || expense.currency || DEFAULT_EXPENSE_CURRENCY;
  const projectBudget = selectedProject?.budget_amount || 0;

  const overspendWarning =
    projectBudget > 0 && budgetAmount > 0
      ? willCauseProjectOverspending(projectBudget, 0, budgetAmount)
      : null;

  return (
    <Card className="category-form-card expense-form-card">
      <form action={updateExpense} className="category-form">
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
    </Card>
  );
}
