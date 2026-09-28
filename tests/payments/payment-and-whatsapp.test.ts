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
  resolveStoredEvidenceMimeType,
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
import { deliverPaidExpenseWhatsApp } from "@/lib/whatsapp/gateway";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";
import {
  buildWaapiMediaPayload,
  buildWaapiTextPayload,
  isWhatsAppConfigured,
  planWhatsAppDelivery,
  publicWhatsAppStatus,
  sanitizeWhatsAppError,
  waapiActionAccepted,
  waapiActionUrl,
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
    const text = buildWaapiTextPayload("244923000000", generatePaidExpenseWhatsAppMessage({ ...expense, locale: "en", amountLabel: "Kz 50,000.00" }));
    const pdf = buildWaapiMediaPayload("244923000000", {
      fileName: "comprovativo.pdf",
      mimeType: "application/pdf",
      bytes: Uint8Array.from([1, 2, 3]),
    });
    const image = buildWaapiMediaPayload("244923000000", {
      fileName: "payment.jpg",
      mimeType: "image/jpeg",
      bytes: Uint8Array.from([4, 5]),
    });
    const webp = buildWaapiMediaPayload("244923000000", {
      fileName: "payment.webp",
      mimeType: "image/webp",
      bytes: Uint8Array.from([6]),
    });

    assert.deepEqual(plan.steps.map((step) => step.type), ["text", "document", "image"]);
    assert.equal(text.chatId, "244923000000@c.us");
    assert.equal(text.message.includes("Payment proof attached"), false);
    assert.equal("mediaUrl" in text, false);
    assert.equal(pdf.mediaName, "comprovativo.pdf");
    assert.equal(pdf.mediaBase64, Buffer.from(Uint8Array.from([1, 2, 3])).toString("base64"));
    assert.equal(pdf.asDocument, true);
    assert.equal(image.asDocument, false);
    assert.equal(webp.asDocument, true);
    assert.equal("mediaUrl" in pdf || "mediaCaption" in pdf, false);
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
    assert.equal(isWhatsAppConfigured({ WAAPI_API_TOKEN: "token", WAAPI_INSTANCE_ID: "abc" }), false);
    assert.equal(isWhatsAppConfigured({ WAAPI_API_TOKEN: "  ", WAAPI_INSTANCE_ID: "42" }), false);
    assert.equal(isWhatsAppConfigured({ WAAPI_API_TOKEN: "token", WAAPI_INSTANCE_ID: "42" }), true);
    assert.deepEqual(publicWhatsAppStatus(false), { configured: false });
    assert.equal(sanitizeWhatsAppError("Bearer EAA123secret failed").includes("EAA123secret"), false);
    assert.equal(waapiActionAccepted({ status: "success", data: { status: "error" } }), false);
    assert.equal(waapiActionAccepted({ status: "success", data: { status: "success" } }), true);
    assert.equal(waapiActionUrl("42", "send-message"), "https://waapi.app/api/v1/instances/42/client/action/send-message");
  });

  it("sends the edited message and keeps the generated template free of attachment text", () => {
    const template = generatePaidExpenseWhatsAppTemplate({ ...expense, locale: "pt" });
    const edited = "Olá João,\n\nA despesa Cartão Lombongo foi paga.\n\nValor: 50.000 Kz.\nObrigado!";
    const outbound = prepareOutboundWhatsAppMessage(edited);
    const payload = buildWaapiTextPayload("244923000000", outbound.ok ? outbound.message : "");

    assert.equal(template.message, generatePaidExpenseWhatsAppMessage({ ...expense, locale: "pt" }));
    assert.equal(messageMentionsAttachment(template.message), false);
    assert.equal(outbound.ok && outbound.message, edited);
    assert.equal(payload.message, edited);
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

describe("WaAPI gateway", () => {
  const config = { token: "waapi-token", instanceId: "42" };

  it("normalizes stored evidence mime types from the file name", () => {
    assert.equal(resolveStoredEvidenceMimeType("comprovativo.pdf", ""), "application/pdf");
    assert.equal(resolveStoredEvidenceMimeType("photo.JPG", "application/octet-stream"), "image/jpeg");
  });

  it("sends the edited text, then each file as base64, and treats a nested error as a failure", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
      const failedMedia = calls.length === 3;
      return new Response(
        JSON.stringify({
          status: "success",
          data: { status: failedMedia ? "error" : "success", message: failedMedia ? "Bearer waapi-token rejected" : "ok" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const sent = await deliverPaidExpenseWhatsApp({
      to: "244923000000",
      body: "Olá João",
      files: [
        { fileName: "comprovativo.pdf", mimeType: "application/pdf", bytes: Uint8Array.from([9]) },
        { fileName: "foto.jpg", mimeType: "image/jpeg", bytes: Uint8Array.from([8]) },
      ],
      config,
      fetchImpl,
    });

    assert.equal(sent.ok, false);
    assert.equal("attachmentsSent" in sent ? sent.attachmentsSent : undefined, undefined);
    assert.equal(calls.length, 3);
    assert.equal(calls[0]?.url, "https://waapi.app/api/v1/instances/42/client/action/send-message");
    assert.equal(calls[0]?.body.message, "Olá João");
    assert.equal(calls[0]?.body.chatId, "244923000000@c.us");
    assert.equal(calls[1]?.url.endsWith("/send-media"), true);
    assert.equal(calls[1]?.body.mediaName, "comprovativo.pdf");
    assert.equal(calls[1]?.body.asDocument, true);
    assert.equal("mediaUrl" in (calls[1]?.body ?? {}), false);
    assert.equal("mediaCaption" in (calls[1]?.body ?? {}), false);
    assert.equal(calls[2]?.body.mediaName, "foto.jpg");
    assert.equal(calls[2]?.body.asDocument, false);
    assert.equal(calls.every((call) => call.url.startsWith("https://waapi.app/")), true);
  });

  it("reports how many receipts were sent after the text message", async () => {
    const fetchImpl: typeof fetch = async () => new Response(
      JSON.stringify({ status: "success", data: { status: "success" } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

    const sent = await deliverPaidExpenseWhatsApp({
      to: "244923000000",
      body: "Pagamento",
      files: [{ fileName: "comprovativo.pdf", mimeType: "application/pdf", bytes: Uint8Array.from([7]) }],
      config,
      fetchImpl,
    });

    assert.equal(sent.ok, true);
    assert.equal(sent.attachmentsSent, 1);
  });
});
