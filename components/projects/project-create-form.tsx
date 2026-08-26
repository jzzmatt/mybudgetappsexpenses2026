import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "@/lib/projects/actions";
import { CURRENCY_LABELS, DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";

export function ProjectCreateForm() {
  return (
    <ResourceFormLayout
      description="Create a named financial workspace with dedicated budget and currency."
      title="Project details"
    >
      <form action={createProjectAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="project-name"
          label="Project Name"
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
        <AuthField
          defaultValue="0"
          id="project-budget"
          inputMode="decimal"
          label="Project Budget"
          min="0"
          name="budget_amount"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <label className="auth-field" htmlFor="project-currency">
          <span>Currency</span>
          <select defaultValue={DEFAULT_EXPENSE_CURRENCY} id="project-currency" name="currency" required>
            {EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {CURRENCY_LABELS[currency]}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-field" htmlFor="project-description">
          <span>Description</span>
          <textarea
            id="project-description"
            name="description"
            placeholder="Optional description"
            rows={4}
          />
        </label>
        <label className="auth-field" htmlFor="project-status">
          <span>Status</span>
          <select defaultValue="active" id="project-status" name="status" required>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <div className="resource-form-actions">
          <Button type="submit">Create project</Button>
          <Link className="auth-link" href="/projects">
            Cancel
          </Link>
        </div>
      </form>
    </ResourceFormLayout>
  );
}
