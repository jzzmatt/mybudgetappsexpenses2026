"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteExpenseAction } from "@/lib/expenses/actions";

type DeleteExpenseButtonProps = {
  expenseId: string;
  expenseDescription: string;
};

export function DeleteExpenseButton({ expenseId, expenseDescription }: DeleteExpenseButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(
      `Delete "${expenseDescription}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExpenseAction(expenseId);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      aria-label={`Delete ${expenseDescription}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
