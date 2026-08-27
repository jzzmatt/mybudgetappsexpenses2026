"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { duplicateExpenseAction, deleteExpenseAction } from "@/lib/expenses/actions";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

type ExpenseActionsMenuProps = {
  expense: ExpenseWithRelations;
};

export function ExpenseActionsMenu({ expense }: ExpenseActionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const onCopy = () => {
    setIsOpen(false);
    startTransition(async () => {
      const result = await duplicateExpenseAction(expense.id);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  const onDelete = () => {
    setIsOpen(false);
    const confirmed = window.confirm(
      `Delete "${expense.description}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExpenseAction(expense.id);

      if (result?.error) {
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="expense-actions-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Actions for ${expense.description}`}
        className="expense-actions-menu-trigger"
        disabled={isPending}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ⋮
      </button>
      {isOpen ? (
        <div className="expense-actions-menu-panel" role="menu">
          <Link
            className="expense-actions-menu-item"
            href={`/expenses/${expense.id}/edit`}
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Edit
          </Link>
          <button
            className="expense-actions-menu-item"
            disabled={isPending}
            onClick={onCopy}
            role="menuitem"
            type="button"
          >
            Copy
          </button>
          <button
            className="expense-actions-menu-item expense-actions-menu-item-danger"
            disabled={isPending}
            onClick={onDelete}
            role="menuitem"
            type="button"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
