"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { deleteVendorAction } from "@/lib/vendors/actions";

type DeleteVendorButtonProps = {
  vendorId: string;
  vendorName: string;
};

export function DeleteVendorButton({ vendorId, vendorName }: DeleteVendorButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  const onDelete = () => {
    const confirmed = window.confirm(t("vendors.deleteConfirm", { name: vendorName }));

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteVendorAction(vendorId);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      aria-label={`${t("common.delete")} ${vendorName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? t("expenses.deleting") : t("common.delete")}
    </Button>
  );
}
