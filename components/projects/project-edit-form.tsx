import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateProjectAction } from "@/lib/projects/actions";
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
          label="Name"
          name="name"
          placeholder="e.g. Alpha Platform"
          required
        />
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
