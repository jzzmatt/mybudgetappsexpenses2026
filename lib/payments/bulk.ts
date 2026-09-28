import { shareAmount } from "@/lib/whatsapp/message";

export const MAX_BULK_EXPENSES = 1000;

export type PaymentCandidate = {
  id: string;
  userId: string;
  status: string;
  currency: string;
  amount: number;
};

export type BulkExpenseOption = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  selectable: boolean;
  projectName: string;
  categoryName: string;
};

export function paymentErrorCode(message: string) {
  const codes = ["selection_changed", "mixed_currency", "not_found", "invalid_selection", "unauthorized", "invalid_evidence"] as const;
  return codes.find((code) => message.includes(code)) ?? "failed";
}

export function payableAmount(paidAmount: number, budgetAmount: number) {
  return shareAmount(paidAmount, budgetAmount);
}

export function isExpensePayable(status: string) {
  return status !== "paid";
}

export function toBulkExpenseOption(expense: {
  id: string;
  description: string;
  status: string;
  currency: string;
  budget_amount: number | string;
  paid_amount: number | string;
  project?: { name: string } | null;
  category?: { name: string } | null;
}): BulkExpenseOption {
  return {
    id: expense.id,
    description: expense.description,
    amount: payableAmount(Number(expense.paid_amount), Number(expense.budget_amount)),
    currency: expense.currency,
    selectable: isExpensePayable(expense.status),
    projectName: expense.project?.name ?? "",
    categoryName: expense.category?.name ?? "",
  };
}

export function evaluatePaymentSelection(requestedIds: string[], rows: PaymentCandidate[], sessionUserId: string) {
  const ids = [...new Set(requestedIds.filter(Boolean))];

  if (ids.length < 1 || ids.length > MAX_BULK_EXPENSES) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  const selected: PaymentCandidate[] = [];

  for (const id of ids) {
    const row = byId.get(id);

    if (!row || row.userId !== sessionUserId) {
      return { ok: false as const, error: "not_found" as const };
    }

    selected.push(row);
  }

  if (selected.some((row) => row.status === "paid")) {
    return { ok: false as const, error: "selection_changed" as const };
  }

  const currencies = new Set(selected.map((row) => row.currency));

  if (currencies.size !== 1) {
    return { ok: false as const, error: "mixed_currency" as const };
  }

  const total = selected.reduce((sum, row) => sum + row.amount, 0);
  const currency = selected[0]?.currency ?? "";

  return {
    ok: true as const,
    ids,
    count: selected.length,
    total,
    currency,
  };
}

export function selectionCurrency(options: BulkExpenseOption[]) {
  const currencies = new Set(options.map((option) => option.currency));

  if (currencies.size !== 1) {
    return { ok: false as const, error: "mixed_currency" as const };
  }

  const currency = options[0]?.currency ?? "";
  const total = options.reduce((sum, option) => sum + option.amount, 0);

  return { ok: true as const, currency, total, count: options.length };
}

export type ScopedPaymentLine = {
  paymentId: string;
  paymentDate: string;
  paymentMethod: string | null;
  paymentDescription: string | null;
  paymentCurrency: string;
  paymentAmount: number;
  expenseId: string;
  description: string;
  projectId: string | null;
  amount: number;
  currency: string;
  reference?: string | null;
  batchStatus?: string | null;
  notificationStatus?: string | null;
};

export type ScopedPaymentSummary = {
  paymentId: string;
  paymentDate: string;
  paymentMethod: string | null;
  description: string | null;
  currency: string;
  total: number;
  expenseCount: number;
  includesAllExpenses: boolean;
  reference: string | null;
  batchStatus: string | null;
  notificationStatus: string | null;
  expenses: { expenseId: string; description: string; amount: number; currency: string }[];
};

export function summarizeScopedPayments(lines: ScopedPaymentLine[], projectIds: string[]): ScopedPaymentSummary[] {
  const allowed = new Set(projectIds);
  const byPayment = new Map<string, ScopedPaymentLine[]>();

  for (const line of lines) {
    const group = byPayment.get(line.paymentId) ?? [];
    group.push(line);
    byPayment.set(line.paymentId, group);
  }

  const summaries: ScopedPaymentSummary[] = [];

  for (const [paymentId, group] of byPayment) {
    const visible = group.filter((line) => line.projectId !== null && allowed.has(line.projectId));

    if (visible.length === 0) {
      continue;
    }

    const first = visible[0];
    summaries.push({
      paymentId,
      paymentDate: first.paymentDate,
      paymentMethod: first.paymentMethod,
      description: first.paymentDescription,
      currency: first.paymentCurrency,
      total: visible.reduce((sum, line) => sum + line.amount, 0),
      expenseCount: visible.length,
      includesAllExpenses: visible.length === group.length,
      reference: first.reference ?? null,
      batchStatus: first.batchStatus ?? null,
      notificationStatus: first.notificationStatus ?? null,
      expenses: visible.map((line) => ({
        expenseId: line.expenseId,
        description: line.description,
        amount: line.amount,
        currency: line.currency,
      })),
    });
  }

  return summaries.sort((left, right) => right.paymentDate.localeCompare(left.paymentDate) || left.paymentId.localeCompare(right.paymentId));
}
