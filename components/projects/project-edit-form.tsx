import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateProjectAction } from "@/lib/projects/actions";
import { CURRENCY_LABELS, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import type { Project } from "@/lib/projects/types";

type ProjectEditFormProps = {
  project: Project;
};

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const updateProject = updateProjectAction.bind(null, project.id);

  return (
    <Card className="category-form-card">
      <form action={updateProject} className="category-form">
        <AuthField
          autoComplete="off"
          defaultValue={project.name}
          id="project-name"
          label="Project Name"
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
        <AuthField
          defaultValue={String(project.budget_amount ?? 0)}
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
          <select defaultValue={project.currency} id="project-currency" name="currency" required>
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
            defaultValue={project.description ?? ""}
            id="project-description"
            name="description"
            placeholder="Optional description"
            rows={4}
          />
        </label>
        <label className="auth-field" htmlFor="project-status">
          <span>Status</span>
          <select defaultValue={project.status} id="project-status" name="status" required>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <div className="category-form-actions">
          <Button type="submit">Save changes</Button>
          <Link className="auth-link" href="/projects">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
