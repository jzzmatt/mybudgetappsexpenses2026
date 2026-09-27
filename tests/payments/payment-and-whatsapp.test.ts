import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPaidExpenseUpdate,
  canSharePaidExpense,
  needsEvidenceWarning,
  normalizePaymentNote,
  paymentAccess,
  resolveExpenseStatus,
  shouldConfirmPayment,
  validateEvidenceFile,
} from "@/lib/payments/rules";
import {
  formatWhatsAppDate,
  generatePaidExpenseWhatsAppMessage,
  generatePaidExpenseWhatsAppTemplate,
  messageExposesInternals,
  messageMentionsAttachment,
  prepareOutboundWhatsAppMessage,
  shareAmount,
  WHATSAPP_TEXT_MAX_LENGTH,
} from "@/lib/whatsapp/message";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";
import {
  buildWhatsAppDocumentPayload,
  buildWhatsAppTextPayload,
  isWhatsAppConfigured,
  planWhatsAppDelivery,
  publicWhatsAppStatus,
  sanitizeWhatsAppError,
} from "@/lib/whatsapp/payload";

const expense = {
  description: "Cartão Lombongo",
  amountLabel: "50.000 Kz",
  paymentDateLabel: "27/09/2026",
  paymentMethodLabel: "Transferência BFA",
  categoryName: "Cartão",
  projectName: "Expenses Setembro 2026",
};

describe("payment confirmation", () => {
  it("asks for confirmation when an unpaid expense becomes paid", () => {
    assert.equal(shouldConfirmPayment("pending", "paid"), true);
    assert.equal(shouldConfirmPayment("partial", "paid"), true);
  });

  it("does not ask again when the expense is already paid", () => {
    assert.equal(shouldConfirmPayment("paid", "paid"), false);
    assert.equal(shouldConfirmPayment("paid", "pending"), false);
  });

  it("sets paid only after payment confirmation and keeps the saved status otherwise", () => {
    assert.equal(resolveExpenseStatus("pending", true), "paid");
    assert.equal(resolveExpenseStatus("partial", true), "paid");
    assert.equal(resolveExpenseStatus("pending", false), "pending");
    assert.equal(resolveExpenseStatus("paid", false), "paid");
    assert.equal(resolveExpenseStatus("paid", true), "paid");
  });

  it("accepts a PDF receipt and an image", () => {
    const pdf = validateEvidenceFile("receipt", { name: "comprovativo.pdf", type: "application/pdf", size: 1200 });
    const image = validateEvidenceFile("image", { name: "foto.jpg", type: "image/jpeg", size: 2400 });

    assert.equal(pdf.ok && pdf.evidenceType, "receipt");
    assert.equal(image.ok && image.mimeType, "image/jpeg");
  });

  it("stores the payment note, date, and method without replacing the expense date", () => {
    const note = normalizePaymentNote("  Pago através do BFA Internet Banking.  ");
    const update = buildPaidExpenseUpdate({
      paidAt: "2026-09-27",
      paymentMethod: "bank_transfer",
      paymentNote: note,
    });

    assert.equal(note, "Pago através do BFA Internet Banking.");
    assert.equal(update.paid_at, "2026-09-27");
    assert.equal(update.payment_method, "bank_transfer");
    assert.equal(update.status, "paid");
    assert.equal("date" in update, false);
  });

  it("warns when payment is confirmed without evidence", () => {
    assert.equal(needsEvidenceWarning(false, false), true);
    assert.equal(needsEvidenceWarning(true, false), false);
  });

  it("hides another user's payment the same way as a missing one", () => {
    assert.equal(paymentAccess("user-b", "user-a"), "not_found");
    assert.equal(paymentAccess(null, "user-a"), "not_found");
    assert.equal(paymentAccess("user-a", "user-a"), "allowed");
  });
});

describe("WhatsApp paid expense message", () => {
  it("includes the payment facts and emoji in Portuguese, English, and French", () => {
    for (const locale of ["pt", "en", "fr"] as const) {
      const message = generatePaidExpenseWhatsAppMessage({ ...expense, locale });
      assert.match(message, /💰/);
      assert.match(message, /Cartão Lombongo/);
      assert.match(message, /50\.000 Kz|50,000 Kz|50 000 Kz|Kz/);
      assert.match(message, /27\/09\/2026/);
      assert.match(message, /Transferência BFA|BFA/);
      assert.match(message, /Cartão/);
      assert.match(message, /Expenses Setembro 2026/);
      assert.match(message, /Pago|Paid|Payé/);
      assert.equal(messageMentionsAttachment(message), false);
    }
  });

  it("keeps storage paths and ids out of the text", () => {
    const message = generatePaidExpenseWhatsAppMessage({ ...expense, locale: "en", amountLabel: "Kz 50,000.00" });
    assert.equal(messageExposesInternals(message, ["user-a/project/file.pdf", "https://example.supabase.co", "11111111-1111-4111-8111-111111111111"]), false);
    assert.equal(messageMentionsAttachment(message), false);
  });

  it("sends a PDF and an image as separate messages after the text", () => {
    const plan = planWhatsAppDelivery([
      { fileName: "comprovativo.pdf", mimeType: "application/pdf" },
      { fileName: "payment.jpg", mimeType: "image/jpeg" },
    ]);
    const text = buildWhatsAppTextPayload("244923000000", generatePaidExpenseWhatsAppMessage({ ...expense, locale: "en", amountLabel: "Kz 50,000.00" }));
    const document = buildWhatsAppDocumentPayload("244923000000", "media-1", "comprovativo.pdf");

    assert.deepEqual(plan.steps.map((step) => step.type), ["text", "document", "image"]);
    assert.equal(text.type, "text");
    assert.equal(text.text.body.includes("Payment proof attached"), false);
    assert.equal(document.type, "document");
    assert.equal("document" in text, false);
  });

  it("sends only the payment message when there is no evidence", () => {
    const plan = planWhatsAppDelivery([]);
    const message = generatePaidExpenseWhatsAppMessage({ ...expense, locale: "pt" });

    assert.deepEqual(plan.steps, [{ type: "text" }]);
    assert.equal(messageMentionsAttachment(message), false);
    assert.equal(message.toLowerCase().includes("sem comprovativo"), false);
  });

  it("rejects an invalid phone and reports when WhatsApp is not configured", () => {
    assert.equal(normalizeWhatsAppNumber("abc").ok, false);
    assert.equal(normalizeWhatsAppNumber("+244 923 000 000").ok, true);
    assert.equal(isWhatsAppConfigured({}), false);
    assert.deepEqual(publicWhatsAppStatus(false), { configured: false });
    assert.equal(sanitizeWhatsAppError("Bearer EAA123secret failed").includes("EAA123secret"), false);
  });

  it("sends the edited message and keeps the generated template free of attachment text", () => {
    const template = generatePaidExpenseWhatsAppTemplate({ ...expense, locale: "pt" });
    const edited = "Olá João,\n\nA despesa Cartão Lombongo foi paga.\n\nValor: 50.000 Kz.\nObrigado!";
    const outbound = prepareOutboundWhatsAppMessage(edited);
    const payload = buildWhatsAppTextPayload("244923000000", outbound.ok ? outbound.message : "");

    assert.equal(template.message, generatePaidExpenseWhatsAppMessage({ ...expense, locale: "pt" }));
    assert.equal(messageMentionsAttachment(template.message), false);
    assert.equal(outbound.ok && outbound.message, edited);
    assert.equal(payload.text.body, edited);
    assert.equal(prepareOutboundWhatsAppMessage("   ").ok, false);
    assert.equal(prepareOutboundWhatsAppMessage("a".repeat(WHATSAPP_TEXT_MAX_LENGTH + 1)).ok, false);
    const typedAttachment = prepareOutboundWhatsAppMessage("Comprovativo em anexo");
    assert.equal(typedAttachment.ok && typedAttachment.message, "Comprovativo em anexo");
  });

  it("does not offer WhatsApp sharing for an unpaid expense", () => {
    assert.equal(canSharePaidExpense("pending"), false);
    assert.equal(canSharePaidExpense("paid"), true);
    assert.equal(formatWhatsAppDate("2026-09-27"), "27/09/2026");
    assert.equal(shareAmount(0, 50000), 50000);
    assert.equal(shareAmount(25000, 50000), 25000);
  });
});
