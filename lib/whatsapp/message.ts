import type { Locale } from "@/lib/i18n/config";

export type PaidExpenseMessageInput = {
  description: string;
  amountLabel: string;
  paymentDateLabel: string;
  paymentMethodLabel: string;
  categoryName: string;
  projectName: string;
  locale: Locale;
};

const ATTACHMENT_PHRASES = [
  "comprovativo em anexo",
  "payment proof attached",
  "preuve de paiement jointe",
  "no payment proof",
  "sem comprovativo",
  "aucune preuve",
];

export function formatWhatsAppDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!match) {
    return isoDate.trim();
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function shareAmount(paidAmount: number, budgetAmount: number) {
  return paidAmount > 0 ? paidAmount : budgetAmount;
}

/** WhatsApp client text limit. WaAPI types `message` as a string and does not publish a smaller maximum. */
export const WHATSAPP_TEXT_MAX_LENGTH = 65536;

export function whatsAppMessageLength(message: string) {
  return Array.from(message).length;
}

export function generatePaidExpenseWhatsAppTemplate(input: PaidExpenseMessageInput) {
  return { message: generatePaidExpenseWhatsAppMessage(input) };
}

export function prepareOutboundWhatsAppMessage(message: string) {
  if (!message.trim()) {
    return { ok: false as const, error: "empty" as const };
  }

  if (whatsAppMessageLength(message) > WHATSAPP_TEXT_MAX_LENGTH) {
    return { ok: false as const, error: "too_long" as const };
  }

  return { ok: true as const, message };
}

export function generatePaidExpenseWhatsAppMessage(input: PaidExpenseMessageInput) {
  const description = input.description.trim();
  const amount = input.amountLabel.trim();
  const paymentDate = input.paymentDateLabel.trim();
  const method = input.paymentMethodLabel.trim() || "—";
  const category = input.categoryName.trim() || "—";
  const project = input.projectName.trim() || "—";

  if (input.locale === "pt") {
    return [
      "💰 *Comprovativo de Pagamento*",
      "",
      `🧾 Despesa: ${description}`,
      `💵 Valor: ${amount}`,
      `📅 Data do pagamento: ${paymentDate}`,
      `💳 Método de pagamento: ${method}`,
      `📂 Categoria: ${category}`,
      `📁 Projeto: ${project}`,
      "",
      "✅ Estado: Pago",
    ].join("\n");
  }

  if (input.locale === "fr") {
    return [
      "💰 *Confirmation de paiement*",
      "",
      `🧾 Dépense : ${description}`,
      `💵 Montant : ${amount}`,
      `📅 Date du paiement : ${paymentDate}`,
      `💳 Mode de paiement : ${method}`,
      `📂 Catégorie : ${category}`,
      `📁 Projet : ${project}`,
      "",
      "✅ Statut : Payé",
    ].join("\n");
  }

  return [
    "💰 *Payment Confirmation*",
    "",
    `🧾 Expense: ${description}`,
    `💵 Amount: ${amount}`,
    `📅 Payment date: ${paymentDate}`,
    `💳 Payment method: ${method}`,
    `📂 Category: ${category}`,
    `📁 Project: ${project}`,
    "",
    "✅ Status: Paid",
  ].join("\n");
}

export const MAX_WHATSAPP_EXPENSE_ITEMS = 30;

export type BulkPaidExpenseLine = {
  description: string;
  amountLabel: string;
};

export function generateBulkPaidExpenseWhatsAppTemplate(input: {
  expenses: BulkPaidExpenseLine[];
  totalLabel: string;
  paymentDateLabel: string;
  paymentMethodLabel: string;
  projectName?: string | null;
  categoryName?: string | null;
  locale: Locale;
}) {
  const lines = input.expenses.map((expense) => ({
    description: expense.description.trim() || "—",
    amountLabel: expense.amountLabel.trim(),
  }));
  const shown = lines.slice(0, MAX_WHATSAPP_EXPENSE_ITEMS);
  const hidden = lines.length - shown.length;
  const method = input.paymentMethodLabel.trim() || "—";
  const project = input.projectName?.trim() || "";
  const category = input.categoryName?.trim() || "";
  const itemLines = shown.map((expense) => `• ${expense.description} — ${expense.amountLabel}`);

  if (input.locale === "pt") {
    return {
      message: [
        "💰 *Comprovativo de Pagamento*",
        "",
        `🧾 Despesas pagas: ${lines.length}`,
        "",
        hidden > 0 ? "📋 Primeiras despesas:" : "📋 Despesas:",
        "",
        ...itemLines,
        ...(hidden > 0 ? ["", `+${hidden} outras despesas`] : []),
        "",
        `💵 *Total pago: ${input.totalLabel}*`,
        "",
        `📅 Data do pagamento: ${input.paymentDateLabel}`,
        `💳 Método de pagamento: ${method}`,
        ...(category ? [`📂 Categoria: ${category}`] : []),
        ...(project ? [`📁 Projeto: ${project}`] : []),
        "",
        "✅ Estado: Pago",
      ].join("\n"),
    };
  }

  if (input.locale === "fr") {
    return {
      message: [
        "💰 *Confirmation de paiement*",
        "",
        `🧾 Dépenses payées : ${lines.length}`,
        "",
        hidden > 0 ? "📋 Premières dépenses :" : "📋 Dépenses :",
        "",
        ...itemLines,
        ...(hidden > 0 ? ["", `+${hidden} autres dépenses`] : []),
        "",
        `💵 *Total payé : ${input.totalLabel}*`,
        "",
        `📅 Date du paiement : ${input.paymentDateLabel}`,
        `💳 Mode de paiement : ${method}`,
        ...(category ? [`📂 Catégorie : ${category}`] : []),
        ...(project ? [`📁 Projet : ${project}`] : []),
        "",
        "✅ Statut : Payé",
      ].join("\n"),
    };
  }

  return {
    message: [
      "💰 *Payment Confirmation*",
      "",
      `🧾 Expenses paid: ${lines.length}`,
      "",
      hidden > 0 ? "📋 First expenses:" : "📋 Expenses:",
      "",
      ...itemLines,
      ...(hidden > 0 ? ["", `+${hidden} other expenses`] : []),
      "",
      `💵 *Total paid: ${input.totalLabel}*`,
      "",
      `📅 Payment date: ${input.paymentDateLabel}`,
      `💳 Payment method: ${method}`,
      ...(category ? [`📂 Category: ${category}`] : []),
      ...(project ? [`📁 Project: ${project}`] : []),
      "",
      "✅ Status: Paid",
    ].join("\n"),
  };
}

export function messageMentionsAttachment(message: string) {
  const normalized = message.toLowerCase();
  return ATTACHMENT_PHRASES.some((phrase) => normalized.includes(phrase));
}

export function messageExposesInternals(message: string, secrets: string[]) {
  return secrets.some((secret) => secret.length > 0 && message.includes(secret));
}
