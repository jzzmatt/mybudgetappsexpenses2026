"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { duplicateExpenseAction } from "@/lib/expenses/actions";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

type CopyExpenseButtonProps = {
  expense: ExpenseWithRelations;
};

export function CopyExpenseButton({ expense }: CopyExpenseButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onCopy = () => {
    startTransition(async () => {
      const result = await duplicateExpenseAction(expense.id);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      aria-label={`Duplicate ${expense.description}`}
      className="button-outline button-small"
      disabled={isPending}
      onClick={onCopy}
      type="button"
    >
      {isPending ? "Copying…" : "Copy"}
    </Button>
  );
}
