import Link from "next/link";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { Card } from "@/components/ui/card";
import type { Project } from "@/lib/projects/types";

type ProjectListProps = {
  projects: Project[];
  search?: string;
};

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ProjectList({ projects, search }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card className="category-empty-card">
        <h2>No projects found</h2>
        <p>
          {search
            ? `No projects match "${search}". Try a different search or create a new project.`
            : "Create your first project to track budgets and expenses."}
        </p>
        <Link className="auth-link" href="/projects/new">
          Create project
        </Link>
      </Card>
    );
  }

  return (
    <Card className="category-table-card">
      <div className="category-table-wrap">
        <table className="category-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Description</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.description || "—"}</td>
                <td>
                  <span className={`status-badge status-${project.status}`}>
                    {formatStatus(project.status)}
                  </span>
                </td>
                <td className="category-table-actions">
                  <Link className="auth-link" href={`/projects/${project.id}/edit`}>
                    Edit
                  </Link>
                  <DeleteProjectButton projectId={project.id} projectName={project.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
