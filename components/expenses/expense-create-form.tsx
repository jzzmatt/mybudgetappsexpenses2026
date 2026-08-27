"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { ImportPaymentProofModal } from "@/components/expenses/import-payment-proof-modal";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createExpenseAction } from "@/lib/expenses/actions";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
  type ExpenseDraftFromProof,
} from "@/lib/expenses/types";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY } from "@/lib/currency/types";
import { formatCurrency, formatLabel } from "@/lib/expenses/format";
import { willCauseProjectOverspending } from "@/lib/projects/calculations";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseCreateFormProps = {
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
  preselectedProjectId?: string;
};

export function ExpenseCreateForm({
  categories,
  projects,
  vendors,
  preselectedProjectId,
}: ExpenseCreateFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const initialProjectId = preselectedProjectId || projects[0]?.id || "";

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [draft, setDraft] = useState<ExpenseDraftFromProof | null>(null);

  const [dateValue, setDateValue] = useState<string>(today);
  const [descriptionValue, setDescriptionValue] = useState<string>("");
  const [vendorIdValue, setVendorIdValue] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethodValue, setPaymentMethodValue] = useState<string>("");
  const [paymentReferenceValue, setPaymentReferenceValue] = useState<string>("");
  const [statusValue, setStatusValue] = useState<string>("pending");
  const [notesValue, setNotesValue] = useState<string>("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const inheritedCurrency = selectedProject?.currency || DEFAULT_EXPENSE_CURRENCY;
  const projectBudget = selectedProject?.budget_amount || 0;

  // When an AI draft is extracted from a payment proof PDF, prefill the state
  const handleDraftLoaded = (extractedDraft: ExpenseDraftFromProof) => {
    setDraft(extractedDraft);
    if (extractedDraft.date) {
      setDateValue(extractedDraft.date);
    }
    if (extractedDraft.description) {
      setDescriptionValue(extractedDraft.description);
    }
    if (extractedDraft.paid_amount !== undefined) {
      setPaidAmount(extractedDraft.paid_amount);
      setBudgetAmount(extractedDraft.suggested_expense_budget || extractedDraft.paid_amount);
    }
    if (extractedDraft.payment_method) {
      setPaymentMethodValue(extractedDraft.payment_method);
    }
    if (extractedDraft.payment_reference) {
      setPaymentReferenceValue(extractedDraft.payment_reference);
    }
    if (extractedDraft.suggested_status) {
      setStatusValue(extractedDraft.suggested_status);
    }
    if (extractedDraft.notes) {
      setNotesValue(extractedDraft.notes);
    }

    // Try matching vendor by name if extracted
    if (extractedDraft.vendor_person) {
      const match = vendors.find(
        (v) => v.name.toLowerCase().includes(extractedDraft.vendor_person!.toLowerCase()) ||
          extractedDraft.vendor_person!.toLowerCase().includes(v.name.toLowerCase()),
      );
      if (match) {
        setVendorIdValue(match.id);
      }
    }
  };

  const overspendWarning =
    projectBudget > 0 && budgetAmount > 0
      ? willCauseProjectOverspending(projectBudget, 0, budgetAmount)
      : null;

  return (
    <ResourceFormLayout
      description="Record an expense manually or import from a PDF payment proof with AI assistance."
      title="New Expense Details"
    >
      {selectedProject ? (
        <div className="expense-import-toolbar">
          <ImportPaymentProofModal
            onDraftLoaded={handleDraftLoaded}
            project={selectedProject}
          />
          {draft?.payment_proof_path ? (
            <span className="expense-proof-attached-badge">
              📎 Proof Attached: {draft.payment_proof_filename}
              {draft.proof_signed_url ? (
                <a
                  className="expense-proof-preview-link"
                  href={draft.proof_signed_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  (View PDF)
                </a>
              ) : null}
            </span>
          ) : null}
        </div>
      ) : null}

      {draft?.extraction_warnings && draft.extraction_warnings.length > 0 ? (
        <div className="expense-ai-warning-box" role="alert">
          <strong>AI Extraction Notes:</strong>
          <ul>
            {draft.extraction_warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={createExpenseAction} className="resource-form resource-form-grid">
        {/* Hidden inputs to retain uploaded PDF proof */}
        <input name="payment_proof_path" type="hidden" value={draft?.payment_proof_path ?? ""} />
        <input name="payment_proof_filename" type="hidden" value={draft?.payment_proof_filename ?? ""} />

        <section className="resource-form-section">
          <h3>Basic information</h3>

          <label className="auth-field" htmlFor="expense-project">
            <span>Project Workspace</span>
            <select
              id="expense-project"
              name="project_id"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              value={selectedProjectId}
            >
              {projects.length === 0 ? (
                <option value="">No projects available (Create a project first)</option>
              ) : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.currency})
                </option>
              ))}
            </select>
          </label>

          <AuthField
            id="expense-date"
            label="Date"
            name="date"
            onChange={(e) => setDateValue(e.target.value)}
            required
            type="date"
            value={dateValue}
          />

          <AuthField
            autoComplete="off"
            id="expense-description"
            label="Description"
            name="description"
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="e.g. Cloud infrastructure"
            required
            value={descriptionValue}
          />

          <label className="auth-field" htmlFor="expense-category">
            <span>Category</span>
            <select defaultValue="" id="expense-category" name="category_id">
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field" htmlFor="expense-vendor">
            <span>Vendor / Supplier</span>
            <select
              id="expense-vendor"
              name="vendor_id"
              onChange={(e) => setVendorIdValue(e.target.value)}
              value={vendorIdValue}
            >
              <option value="">No vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>

          <AuthField
            autoComplete="off"
            id="expense-payment-ref"
            label="Payment Reference / Transaction ID"
            name="payment_reference"
            onChange={(e) => setPaymentReferenceValue(e.target.value)}
            placeholder="e.g. TRX-938218 / 32305151"
            value={paymentReferenceValue}
          />
        </section>

        <section className="resource-form-section">
          <h3>Budget &amp; Status</h3>

          <div className="auth-field">
            <span>Workspace Currency (Inherited)</span>
            <div className="expense-currency-display">
              <strong>{CURRENCY_LABELS[inheritedCurrency]}</strong>
              <input name="currency" type="hidden" value={inheritedCurrency} />
            </div>
          </div>

          <AuthField
            id="expense-budget"
            inputMode="decimal"
            label="Expense Budget"
            min="0"
            name="budget_amount"
            onChange={(e) => setBudgetAmount(Number(e.target.value) || 0)}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={budgetAmount ? String(budgetAmount) : ""}
          />

          {overspendWarning?.isOverspent ? (
            <div className="expense-overspend-warning" role="alert">
              ⚠️ Warning: This expense ({formatCurrency(budgetAmount, inheritedCurrency)}) exceeds the Project Budget ({formatCurrency(projectBudget, inheritedCurrency)}). You can still proceed if intended.
            </div>
          ) : null}

          <AuthField
            id="expense-paid"
            inputMode="decimal"
            label="Paid Amount"
            min="0"
            name="paid_amount"
            onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={paidAmount ? String(paidAmount) : "0"}
          />

          <label className="auth-field" htmlFor="expense-payment-method">
            <span>Payment method</span>
            <select
              id="expense-payment-method"
              name="payment_method"
              onChange={(e) => setPaymentMethodValue(e.target.value)}
              value={paymentMethodValue}
            >
              <option value="">Not specified</option>
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {formatLabel(method)}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field" htmlFor="expense-priority">
            <span>Priority</span>
            <select defaultValue="" id="expense-priority" name="priority">
              <option value="">Not specified</option>
              {EXPENSE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field" htmlFor="expense-status">
            <span>Status</span>
            <select
              id="expense-status"
              name="status"
              onChange={(e) => setStatusValue(e.target.value)}
              required
              value={statusValue}
            >
              {EXPENSE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field resource-form-span-2" htmlFor="expense-notes">
            <span>Notes</span>
            <textarea
              id="expense-notes"
              name="notes"
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Optional notes"
              rows={4}
              value={notesValue}
            />
          </label>
        </section>

        <div className="resource-form-actions resource-form-span-2">
          <Button type="submit">Create expense</Button>
          <Link
            className="auth-link"
            href={selectedProjectId ? `/projects/${selectedProjectId}/expenses` : "/expenses"}
          >
            Cancel
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
