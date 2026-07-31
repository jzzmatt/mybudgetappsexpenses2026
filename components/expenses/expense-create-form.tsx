import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createExpenseAction } from "@/lib/expenses/actions";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
} from "@/lib/expenses/types";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { formatLabel } from "@/lib/expenses/format";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseCreateFormProps = {
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
};

export function ExpenseCreateForm({ categories, projects, vendors }: ExpenseCreateFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="category-form-card expense-form-card">
      <form action={createExpenseAction} className="category-form">
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
          <select id="expense-category" name="category_id">
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="expense-project">
          <span>Project</span>
          <select id="expense-project" name="project_id">
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="expense-vendor">
          <span>Vendor</span>
          <select id="expense-vendor" name="vendor_id">
            <option value="">No vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="expense-currency">
          <span>Currency</span>
          <select defaultValue={DEFAULT_EXPENSE_CURRENCY} id="expense-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <AuthField
          id="expense-budget"
          inputMode="decimal"
          label="Budget amount"
          min="0"
          name="budget_amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <AuthField
          defaultValue="0"
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
          <select id="expense-payment-method" name="payment_method">
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
          <select id="expense-priority" name="priority">
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
        <label className="auth-field" htmlFor="expense-notes">
          <span>Notes</span>
          <textarea id="expense-notes" name="notes" placeholder="Optional notes" rows={4} />
        </label>
        <div className="category-form-actions">
          <Button type="submit">Create expense</Button>
          <Link className="auth-link" href="/expenses">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
