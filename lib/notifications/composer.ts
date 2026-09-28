import type { Locale } from "@/lib/i18n/config";
import { MAX_WHATSAPP_EXPENSE_ITEMS } from "@/lib/whatsapp/message";

export type NotificationExpenseLine = {
  description: string;
  amountLabel: string;
  category: string;
  dateLabel: string;
};

export type PaymentNotificationPayload = {
  reference: string;
  totalLabel: string;
  expenses: NotificationExpenseLine[];
  attachmentCount: number;
  locale: Locale;
};

export type PaymentBatchExpenseView = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  vendor: string;
  date: string;
  status: string;
  hasEvidence: boolean;
};

export type PaymentBatchPreview = {
  paymentId: string;
  reference: string;
  batchStatus: string;
  currency: string;
  total: number;
  expenseCount: number;
  attachmentCount: number;
  expenses: PaymentBatchExpenseView[];
  message: string;
};

export function formatPaymentReference(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999 || !Number.isInteger(sequence) || sequence < 1) {
    throw new Error("invalid_reference");
  }

  return `PAY-${year}-${String(sequence).padStart(6, "0")}`;
}

export function isPaymentReference(value: string) {
  return /^PAY-\d{4}-\d{6}$/.test(value);
}

export function renderPaymentNotification(payload: PaymentNotificationPayload) {
  const shown = payload.expenses.slice(0, MAX_WHATSAPP_EXPENSE_ITEMS);
  const hidden = payload.expenses.length - shown.length;
  const itemLines = shown.map((expense, index) => {
    const category = expense.category.trim() || "—";
    const date = expense.dateLabel.trim() || "—";
    return `${index + 1}. ${expense.description.trim()} — ${expense.amountLabel.trim()} — ${category} — ${date}`;
  });

  if (hidden > 0) {
    itemLines.push(hiddenLine(payload.locale, hidden));
  }

  return [
    headerLine(payload.locale, payload.reference),
    "",
    ...itemLines,
    "",
    totalLine(payload.locale, payload.totalLabel),
    receiptLine(payload.locale, payload.attachmentCount),
  ].join("\n");
}

export type BatchOperation = "notify" | "confirm_and_notify";

export function resolveBatchOutcome(input: {
  operation: BatchOperation;
  paymentConfirmed: boolean;
  notificationSent: boolean;
}) {
  if (input.operation === "notify") {
    return {
      batchStatus: "pending" as const,
      notificationStatus: input.notificationSent ? ("sent" as const) : ("failed" as const),
      claimPaymentSuccess: false,
      claimNotificationSuccess: input.notificationSent,
    };
  }

  if (!input.paymentConfirmed) {
    return {
      batchStatus: "pending" as const,
      notificationStatus: "not_attempted" as const,
      claimPaymentSuccess: false,
      claimNotificationSuccess: false,
    };
  }

  return {
    batchStatus: "paid" as const,
    notificationStatus: input.notificationSent ? ("sent" as const) : ("failed" as const),
    claimPaymentSuccess: true,
    claimNotificationSuccess: input.notificationSent,
  };
}

function headerLine(locale: Locale, reference: string) {
  if (locale === "pt") {
    return `💰 Pagamento ${reference}`;
  }

  if (locale === "fr") {
    return `💰 Paiement ${reference}`;
  }

  return `💰 Payment ${reference}`;
}

function totalLine(locale: Locale, totalLabel: string) {
  if (locale === "pt") {
    return `Total: ${totalLabel}`;
  }

  if (locale === "fr") {
    return `Total : ${totalLabel}`;
  }

  return `Total: ${totalLabel}`;
}

function receiptLine(locale: Locale, count: number) {
  if (count <= 0) {
    if (locale === "pt") {
      return "Comprovativos: sem comprovativo";
    }

    if (locale === "fr") {
      return "Justificatifs : aucun justificatif";
    }

    return "Receipts: no receipt";
  }

  if (locale === "pt") {
    return `Comprovativos: ${count}`;
  }

  if (locale === "fr") {
    return `Justificatifs : ${count}`;
  }

  return `Receipts: ${count}`;
}

function hiddenLine(locale: Locale, count: number) {
  if (locale === "pt") {
    return `+${count} outras`;
  }

  if (locale === "fr") {
    return `+${count} autres`;
  }

  return `+${count} more`;
}
