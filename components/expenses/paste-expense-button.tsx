"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { hasExpenseClipboard } from "@/lib/expenses/clipboard";

export function PasteExpenseButton() {
  const router = useRouter();
  const [canPaste, setCanPaste] = useState(false);

  useEffect(() => {
    setCanPaste(hasExpenseClipboard());

    const onStorage = () => setCanPaste(hasExpenseClipboard());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    window.addEventListener("expense-clipboard-changed", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
      window.removeEventListener("expense-clipboard-changed", onStorage);
    };
  }, []);

  const onPaste = () => {
    if (!hasExpenseClipboard()) {
      return;
    }

    router.push("/expenses/new?paste=true");
  };

  return (
    <Button
      className="button-outline button-small"
      disabled={!canPaste}
      onClick={onPaste}
      title={canPaste ? "Paste copied expense into a new form" : "Copy an expense first"}
      type="button"
    >
      Paste
    </Button>
  );
}
