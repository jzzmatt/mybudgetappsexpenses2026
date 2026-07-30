import Link from "next/link";
import { ProjectSearchForm } from "@/components/projects/project-search-form";

type ProjectToolbarProps = {
  search?: string;
};

export function ProjectToolbar({ search }: ProjectToolbarProps) {
  return (
    <div className="category-toolbar">
      <ProjectSearchForm defaultValue={search} />
      <Link className="button button-small" href="/projects/new">
        New project
      </Link>
    </div>
  );
}
