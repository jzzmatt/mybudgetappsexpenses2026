import { ProjectSearchForm } from "@/components/projects/project-search-form";
import { ListToolbarCard } from "@/components/layout/list-toolbar-card";

type ProjectToolbarProps = {
  search?: string;
};

export function ProjectToolbar({ search }: ProjectToolbarProps) {
  return (
    <ListToolbarCard>
      <ProjectSearchForm defaultValue={search} />
    </ListToolbarCard>
  );
}
