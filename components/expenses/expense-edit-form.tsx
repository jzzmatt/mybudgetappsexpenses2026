import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { CopyExpenseButton } from "@/components/expenses/copy-expense-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateExpenseAction } from "@/lib/expenses/actions";
import { formatLabel } from "@/lib/expenses/format";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
  type ExpenseWithRelations,
} from "@/lib/expenses/types";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
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

  return (
    <Card className="category-form-card expense-form-card">
      <form action={updateExpense} className="category-form">
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
        <label className="auth-field" htmlFor="expense-project">
          <span>Project</span>
          <select defaultValue={expense.project_id ?? ""} id="expense-project" name="project_id">
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
          <select defaultValue={expense.vendor_id ?? ""} id="expense-vendor" name="vendor_id">
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
          <select defaultValue={expense.currency} id="expense-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <AuthField
          defaultValue={String(expense.budget_amount)}
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
          <Link className="auth-link" href="/expenses">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
