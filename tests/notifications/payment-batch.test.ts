import assert from "node:assert/strict";
import test from "node:test";
import { formatPaymentReference, isPaymentReference, renderPaymentNotification, resolveBatchOutcome } from "@/lib/notifications/composer";
import { summarizeScopedPayments } from "@/lib/payments/bulk";
import { prepareOutboundWhatsAppMessage } from "@/lib/whatsapp/message";

test("payment references use PAY-YYYY-000001", () => {
  assert.equal(formatPaymentReference(2026, 1), "PAY-2026-000001");
  assert.equal(formatPaymentReference(2026, 123), "PAY-2026-000123");
  assert.equal(isPaymentReference("PAY-2026-000001"), true);
  assert.equal(isPaymentReference("PAY-26-1"), false);
  assert.throws(() => formatPaymentReference(2026, 0));
});

test("the payment notification lists the reference, expenses, total, and receipt count", () => {
  const message = renderPaymentNotification({
    reference: "PAY-2026-000123",
    totalLabel: "Kz 48,000.00",
    attachmentCount: 2,
    locale: "pt",
    expenses: [
      { description: "Cimento", amountLabel: "Kz 25,000.00", category: "Materiais", dateLabel: "27/09/2026" },
      { description: "Areia", amountLabel: "Kz 15,000.00", category: "Materiais", dateLabel: "27/09/2026" },
      { description: "Transporte", amountLabel: "Kz 8,000.00", category: "Logística", dateLabel: "28/09/2026" },
    ],
  });

  assert.match(message, /Pagamento PAY-2026-000123/);
  assert.match(message, /1\. Cimento — Kz 25,000\.00 — Materiais — 27\/09\/2026/);
  assert.match(message, /2\. Areia/);
  assert.match(message, /3\. Transporte/);
  assert.match(message, /Total: Kz 48,000\.00/);
  assert.match(message, /Comprovativos: 2/);
  assert.doesNotMatch(message, /anexo/i);
});

test("a notification with no files says that no receipt is included", () => {
  const english = renderPaymentNotification({
    reference: "PAY-2026-000002",
    totalLabel: "$10.00",
    attachmentCount: 0,
    locale: "en",
    expenses: [{ description: "Sand", amountLabel: "$10.00", category: "Materials", dateLabel: "27/09/2026" }],
  });
  const french = renderPaymentNotification({
    reference: "PAY-2026-000002",
    totalLabel: "10,00 €",
    attachmentCount: 0,
    locale: "fr",
    expenses: [{ description: "Sable", amountLabel: "10,00 €", category: "Matériaux", dateLabel: "27/09/2026" }],
  });

  assert.match(english, /Payment PAY-2026-000002/);
  assert.match(english, /Receipts: no receipt/);
  assert.match(french, /Paiement PAY-2026-000002/);
  assert.match(french, /aucun justificatif/);
  assert.doesNotMatch(english, /attached/i);
});

test("the edited notification is sent unchanged", () => {
  const edited = "PAY-2026-000123\nCustom note\nComprovativo em anexo";
  const outbound = prepareOutboundWhatsAppMessage(edited);

  assert.equal(outbound.ok, true);
  if (outbound.ok) {
    assert.equal(outbound.message, edited);
  }
});

test("notification success does not claim the batch is paid", () => {
  const notified = resolveBatchOutcome({ operation: "notify", paymentConfirmed: false, notificationSent: true });
  const notifyFailed = resolveBatchOutcome({ operation: "notify", paymentConfirmed: false, notificationSent: false });

  assert.equal(notified.batchStatus, "pending");
  assert.equal(notified.claimPaymentSuccess, false);
  assert.equal(notified.claimNotificationSuccess, true);
  assert.equal(notifyFailed.notificationStatus, "failed");
  assert.equal(notifyFailed.claimPaymentSuccess, false);
});

test("a paid batch keeps its payment when the notification fails", () => {
  const outcome = resolveBatchOutcome({ operation: "confirm_and_notify", paymentConfirmed: true, notificationSent: false });

  assert.equal(outcome.batchStatus, "paid");
  assert.equal(outcome.notificationStatus, "failed");
  assert.equal(outcome.claimPaymentSuccess, true);
  assert.equal(outcome.claimNotificationSuccess, false);
});

test("a failed payment does not send or claim success", () => {
  const outcome = resolveBatchOutcome({ operation: "confirm_and_notify", paymentConfirmed: false, notificationSent: true });

  assert.equal(outcome.notificationStatus, "not_attempted");
  assert.equal(outcome.claimPaymentSuccess, false);
  assert.equal(outcome.claimNotificationSuccess, false);
});

test("payment summaries keep the batch reference and notification status", () => {
  const [summary] = summarizeScopedPayments([
    {
      paymentId: "pay-1",
      paymentDate: "2026-09-28",
      paymentMethod: "cash",
      paymentDescription: null,
      paymentCurrency: "KZ",
      paymentAmount: 100,
      expenseId: "exp-1",
      description: "Cimento",
      projectId: "project-1",
      amount: 100,
      currency: "KZ",
      reference: "PAY-2026-000010",
      batchStatus: "pending",
      notificationStatus: "failed",
    },
  ], ["project-1"]);

  assert.equal(summary.reference, "PAY-2026-000010");
  assert.equal(summary.batchStatus, "pending");
  assert.equal(summary.notificationStatus, "failed");
  assert.equal(summary.expenses[0]?.description, "Cimento");
});
