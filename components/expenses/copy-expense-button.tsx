"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { expenseToClipboardData, writeExpenseClipboard } from "@/lib/expenses/clipboard";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

type CopyExpenseButtonProps = {
  expense: ExpenseWithRelations;
};

export function CopyExpenseButton({ expense }: CopyExpenseButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    writeExpenseClipboard(expenseToClipboardData(expense));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      aria-label={`Copy ${expense.description}`}
      className="button-outline button-small"
      onClick={onCopy}
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
