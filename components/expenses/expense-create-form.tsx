"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createExpenseAction } from "@/lib/expenses/actions";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
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
  const [budgetAmount, setBudgetAmount] = useState<number>(0);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const inheritedCurrency = selectedProject?.currency || DEFAULT_EXPENSE_CURRENCY;
  const projectBudget = selectedProject?.budget_amount || 0;

  const overspendWarning =
    projectBudget > 0 && budgetAmount > 0
      ? willCauseProjectOverspending(projectBudget, 0, budgetAmount)
      : null;

  return (
    <ResourceFormLayout
      description="Record a new expense within a project financial workspace."
      title="New Expense Details"
    >
      <form action={createExpenseAction} className="resource-form resource-form-grid">
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
            defaultValue={today}
            id="expense-date"
            label="Date"
            name="date"
            required
            type="date"
          />

          <AuthField
            autoComplete="off"
            id="expense-description"
            label="Description"
            name="description"
            placeholder="e.g. Cloud infrastructure"
            required
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
            <span>Vendor</span>
            <select defaultValue="" id="expense-vendor" name="vendor_id">
              <option value="">No vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
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
          />

          {overspendWarning?.isOverspent ? (
            <div className="expense-overspend-warning" role="alert">
              ⚠️ Warning: This expense ({formatCurrency(budgetAmount, inheritedCurrency)}) exceeds the Project Budget ({formatCurrency(projectBudget, inheritedCurrency)}). You can still proceed if intended.
            </div>
          ) : null}

          <AuthField
            defaultValue="0"
            id="expense-paid"
            inputMode="decimal"
            label="Paid Amount"
            min="0"
            name="paid_amount"
            placeholder="0.00"
            required
            step="0.01"
            type="number"
          />

          <label className="auth-field" htmlFor="expense-payment-method">
            <span>Payment method</span>
            <select defaultValue="" id="expense-payment-method" name="payment_method">
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
            <select defaultValue="pending" id="expense-status" name="status" required>
              {EXPENSE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-field resource-form-span-2" htmlFor="expense-notes">
            <span>Notes</span>
            <textarea id="expense-notes" name="notes" placeholder="Optional notes" rows={4} />
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
