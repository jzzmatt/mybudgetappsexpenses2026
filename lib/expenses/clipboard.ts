import type { ExpenseCurrency } from "@/lib/currency/types";
import type { ExpenseWithRelations } from "@/lib/expenses/types";

export const EXPENSE_CLIPBOARD_KEY = "budgetapp:expense-clipboard";

export type ExpenseClipboardData = {
  date: string;
  description: string;
  category_id: string;
  project_id: string;
  vendor_id: string;
  budget_amount: string;
  paid_amount: string;
  currency: ExpenseCurrency;
  payment_method: string;
  priority: string;
  status: string;
  notes: string;
};

export function expenseToClipboardData(expense: ExpenseWithRelations): ExpenseClipboardData {
  return {
    date: expense.date,
    description: expense.description,
    category_id: expense.category_id ?? "",
    project_id: expense.project_id ?? "",
    vendor_id: expense.vendor_id ?? "",
    budget_amount: String(expense.budget_amount),
    paid_amount: String(expense.paid_amount),
    currency: expense.currency,
    payment_method: expense.payment_method ?? "",
    priority: expense.priority ?? "",
    status: expense.status,
    notes: expense.notes ?? "",
  };
}

export function readExpenseClipboard(): ExpenseClipboardData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(EXPENSE_CLIPBOARD_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ExpenseClipboardData;
  } catch {
    return null;
  }
}

export function writeExpenseClipboard(data: ExpenseClipboardData) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(EXPENSE_CLIPBOARD_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("expense-clipboard-changed"));
}

export function clearExpenseClipboard() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(EXPENSE_CLIPBOARD_KEY);
  window.dispatchEvent(new Event("expense-clipboard-changed"));
}

export function hasExpenseClipboard() {
  return readExpenseClipboard() !== null;
}
