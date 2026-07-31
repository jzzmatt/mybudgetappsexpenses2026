"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExpenseCreateForm } from "@/components/expenses/expense-create-form";
import {
  clearExpenseClipboard,
  readExpenseClipboard,
  type ExpenseClipboardData,
} from "@/lib/expenses/clipboard";
import type { Category } from "@/lib/categories/types";
import type { Project } from "@/lib/projects/types";
import type { Vendor } from "@/lib/vendors/types";

type ExpenseCreateFormLoaderProps = {
  categories: Category[];
  projects: Project[];
  vendors: Vendor[];
};

function withCopySuffix(description: string) {
  const suffix = " (Copy)";

  if (description.endsWith(suffix)) {
    return description;
  }

  return `${description}${suffix}`;
}

export function ExpenseCreateFormLoader({
  categories,
  projects,
  vendors,
}: ExpenseCreateFormLoaderProps) {
  const searchParams = useSearchParams();
  const shouldPaste = searchParams.get("paste") === "true";
  const [initialValues, setInitialValues] = useState<ExpenseClipboardData | undefined>();
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldPaste) {
      return;
    }

    const clipboard = readExpenseClipboard();

    if (!clipboard) {
      setPasteMessage("No copied expense found. Copy an expense from the list and try again.");
      return;
    }

    setInitialValues({
      ...clipboard,
      description: withCopySuffix(clipboard.description),
    });
    clearExpenseClipboard();
    setPasteMessage("Copied expense loaded. Review the details and save when ready.");
  }, [shouldPaste]);

  return (
    <>
      {pasteMessage ? (
        <p className={initialValues ? "form-success" : "form-error page-error"} role="status">
          {pasteMessage}
        </p>
      ) : null}
      <ExpenseCreateForm
        categories={categories}
        initialValues={initialValues}
        projects={projects}
        vendors={vendors}
      />
    </>
  );
}
