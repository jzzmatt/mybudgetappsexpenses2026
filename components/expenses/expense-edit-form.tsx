"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateExpenseAction } from "@/lib/expenses/actions";
import { formatCurrency, formatLabel } from "@/lib/expenses/format";
import { willCauseProjectOverspending } from "@/lib/projects/calculations";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
  type ExpenseWithRelations,
} from "@/lib/expenses/types";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY } from "@/lib/currency/types";
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
          <span>Project Workspace</span>
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
          label="Date"
          name="date"
          required
          type="date"
        />

        <AuthField
          autoComplete="off"
          defaultValue={expense.description}
          id="expense-description"
          label="Description"
          name="description"
          placeholder="e.g. Cloud infrastructure"
          required
        />

        <label className="auth-field" htmlFor="expense-category">
          <span>Category</span>
          <select
            defaultValue={expense.category_id ?? ""}
            id="expense-category"
            name="category_id"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field" htmlFor="expense-vendor">
          <span>Vendor</span>
          <select defaultValue={expense.vendor_id ?? ""} id="expense-vendor" name="vendor_id">
            <option value="">No vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>

        <div className="auth-field">
          <span>Workspace Currency (Inherited)</span>
          <div className="expense-currency-display">
            <strong>{CURRENCY_LABELS[inheritedCurrency]}</strong>
            <input name="currency" type="hidden" value={inheritedCurrency} />
          </div>
        </div>

        <AuthField
          defaultValue={String(expense.budget_amount)}
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
        />

        {overspendWarning?.isOverspent ? (
          <div className="expense-overspend-warning" role="alert">
            ⚠️ Warning: This expense ({formatCurrency(budgetAmount, inheritedCurrency)}) exceeds the Project Budget ({formatCurrency(projectBudget, inheritedCurrency)}).
          </div>
        ) : null}

        <AuthField
          defaultValue={String(expense.paid_amount)}
          id="expense-paid"
          inputMode="decimal"
          label="Paid amount"
          min="0"
          name="paid_amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />

        <label className="auth-field" htmlFor="expense-payment-method">
          <span>Payment method</span>
          <select
            defaultValue={expense.payment_method ?? ""}
            id="expense-payment-method"
            name="payment_method"
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
          <select defaultValue={expense.priority ?? ""} id="expense-priority" name="priority">
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
          <select defaultValue={expense.status} id="expense-status" name="status" required>
            {EXPENSE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field" htmlFor="expense-notes">
          <span>Notes</span>
          <textarea
            defaultValue={expense.notes ?? ""}
            id="expense-notes"
            name="notes"
            placeholder="Optional notes"
            rows={4}
          />
        </label>

        <div className="category-form-actions">
          <Button type="submit">Save changes</Button>
          <CopyExpenseButton expense={expense} />
          <Link
            className="auth-link"
            href={expense.project_id ? `/projects/${expense.project_id}/expenses` : "/expenses"}
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
