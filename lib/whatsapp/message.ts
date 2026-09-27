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

export function messageMentionsAttachment(message: string) {
  const normalized = message.toLowerCase();
  return ATTACHMENT_PHRASES.some((phrase) => normalized.includes(phrase));
}

export function messageExposesInternals(message: string, secrets: string[]) {
  return secrets.some((secret) => secret.length > 0 && message.includes(secret));
}
