"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/lib/categories/actions";

type DeleteCategoryButtonProps = {
  categoryId: string;
  categoryName: string;
};

export function DeleteCategoryButton({ categoryId, categoryName }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(`Delete "${categoryName}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      aria-label={`Delete ${categoryName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
