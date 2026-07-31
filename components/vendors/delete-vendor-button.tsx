"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteVendorAction } from "@/lib/vendors/actions";

type DeleteVendorButtonProps = {
  vendorId: string;
  vendorName: string;
};

export function DeleteVendorButton({ vendorId, vendorName }: DeleteVendorButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const confirmed = window.confirm(`Delete "${vendorName}"? This action cannot be undone.`);

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
      aria-label={`Delete ${vendorName}`}
      className="button-danger button-small"
      disabled={isPending}
      onClick={onDelete}
      type="button"
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
