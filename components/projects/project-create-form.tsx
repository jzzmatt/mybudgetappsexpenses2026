import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { ResourceFormLayout } from "@/components/layout/resource-form-layout";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "@/lib/projects/actions";

export function ProjectCreateForm() {
  return (
    <ResourceFormLayout
      description="Create a project to group related expenses and budgets."
      title="Project details"
    >
      <form action={createProjectAction} className="resource-form">
        <AuthField
          autoComplete="off"
          id="project-name"
          label="Name"
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
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
