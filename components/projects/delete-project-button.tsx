"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { deleteProjectAction } from "@/lib/projects/actions";

type DeleteProjectButtonProps = {
  projectId: string;
  projectName: string;
};

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  const onDelete = () => {
    const confirmed = window.confirm(t("projects.deleteConfirm", { name: projectName }));

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
    <Button
      aria-label={`${t("common.delete")} ${projectName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? t("expenses.deleting") : t("common.delete")}
    </Button>
  );
}
