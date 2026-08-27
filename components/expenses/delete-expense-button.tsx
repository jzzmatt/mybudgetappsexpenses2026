"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { deleteExpenseAction } from "@/lib/expenses/actions";

type DeleteExpenseButtonProps = {
  expenseId: string;
  expenseDescription: string;
};

export function DeleteExpenseButton({ expenseId, expenseDescription }: DeleteExpenseButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  const onDelete = () => {
    const confirmed = window.confirm(
      t("expenses.deleteConfirm", { name: expenseDescription }),
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
      aria-label={`${t("common.delete")} ${expenseDescription}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? t("expenses.deleting") : t("common.delete")}
    </Button>
  );
}
