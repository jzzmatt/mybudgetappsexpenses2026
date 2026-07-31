"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteBudgetAction } from "@/lib/budgets/actions";

type DeleteBudgetButtonProps = {
  budgetId: string;
  budgetName: string;
};

export function DeleteBudgetButton({ budgetId, budgetName }: DeleteBudgetButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(`Delete "${budgetName}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBudgetAction(budgetId);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      aria-label={`Delete ${budgetName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
