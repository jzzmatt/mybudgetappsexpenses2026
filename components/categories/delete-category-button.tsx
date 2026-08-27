"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { deleteCategoryAction } from "@/lib/categories/actions";

type DeleteCategoryButtonProps = {
  categoryId: string;
  categoryName: string;
};

export function DeleteCategoryButton({ categoryId, categoryName }: DeleteCategoryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  const onDelete = () => {
    const confirmed = window.confirm(t("categories.deleteConfirm", { name: categoryName }));

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
      aria-label={`${t("common.delete")} ${categoryName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? t("expenses.deleting") : t("common.delete")}
    </Button>
  );
}
