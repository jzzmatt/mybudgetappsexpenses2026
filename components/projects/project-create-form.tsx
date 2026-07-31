import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createProjectAction } from "@/lib/projects/actions";

export function ProjectCreateForm() {
  return (
    <Card className="category-form-card">
      <form action={createProjectAction} className="category-form">
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
        <div className="category-form-actions">
          <Button type="submit">Create project</Button>
          <Link className="auth-link" href="/projects">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
