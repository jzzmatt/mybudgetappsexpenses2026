"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/lib/projects/actions";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
};

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(`Delete "${projectName}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProjectAction(projectId);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button className="button-danger button-small" disabled={isPending} onClick={onDelete} type="button">
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
