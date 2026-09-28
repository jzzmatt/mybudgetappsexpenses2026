import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluatePaymentSelection, payableAmount, paymentErrorCode, selectionCurrency, summarizeScopedPayments } from "@/lib/payments/bulk";
import {
  generateBulkPaidExpenseWhatsAppTemplate,
  MAX_WHATSAPP_EXPENSE_ITEMS,
  messageMentionsAttachment,
  prepareOutboundWhatsAppMessage,
} from "@/lib/whatsapp/message";
import { readWaapiMessageIds } from "@/lib/whatsapp/payload";

const user = "user-a";

describe("bulk payment selection", () => {
  it("sums payable amounts on the server and rejects another user's expense", () => {
    const rows = [
      { id: "a", userId: user, status: "pending", currency: "KZ", amount: payableAmount(0, 45000) },
      { id: "b", userId: user, status: "partial", currency: "KZ", amount: payableAmount(10000, 25000) },
      { id: "c", userId: "user-b", status: "pending", currency: "KZ", amount: 50000 },
    ];

    const accepted = evaluatePaymentSelection(["a", "b"], rows, user);
    const rejected = evaluatePaymentSelection(["a", "c"], rows, user);

    assert.equal(accepted.ok && accepted.total, 55000);
    assert.equal(accepted.ok && accepted.count, 2);
    assert.equal(rejected.ok, false);
    assert.equal(!rejected.ok && rejected.error, "not_found");
  });

  it("rejects a paid expense and mixed currencies without a partial total", () => {
    const paid = evaluatePaymentSelection(
      ["a", "b"],
      [
        { id: "a", userId: user, status: "pending", currency: "KZ", amount: 10 },
        { id: "b", userId: user, status: "paid", currency: "KZ", amount: 20 },
      ],
      user,
    );
    const mixed = selectionCurrency([
      { id: "a", description: "A", amount: 10, currency: "KZ", selectable: true, projectName: "", categoryName: "" },
      { id: "b", description: "B", amount: 5, currency: "USD", selectable: true, projectName: "", categoryName: "" },
    ]);

    assert.equal(!paid.ok && paid.error, "selection_changed");
    assert.equal(mixed.ok, false);
  });

  it("maps database failures that must roll the payment back", () => {
    assert.equal(paymentErrorCode("selection_changed"), "selection_changed");
    assert.equal(paymentErrorCode("mixed_currency"), "mixed_currency");
    assert.equal(paymentErrorCode("not_found"), "not_found");
  });
});

describe("bulk WhatsApp template", () => {
  const expenses = [
    { description: "Electricidade", amountLabel: "45.000 Kz" },
    { description: "Internet", amountLabel: "25.000 Kz" },
    { description: "Cartão Lombongo", amountLabel: "50.000 Kz" },
    { description: "Transporte", amountLabel: "15.000 Kz" },
  ];

  it("lists every description and amount in Portuguese, English, and French", () => {
    const shared = {
      expenses,
      totalLabel: "135.000 Kz",
      paymentDateLabel: "28/09/2026",
      paymentMethodLabel: "Transferência Bancária",
      projectName: "Expenses Setembro 2026",
    };

    const pt = generateBulkPaidExpenseWhatsAppTemplate({ ...shared, locale: "pt" }).message;
    const en = generateBulkPaidExpenseWhatsAppTemplate({ ...shared, locale: "en", paymentMethodLabel: "Bank transfer" }).message;
    const fr = generateBulkPaidExpenseWhatsAppTemplate({ ...shared, locale: "fr", paymentMethodLabel: "Virement bancaire" }).message;

    for (const message of [pt, en, fr]) {
      assert.match(message, /Electricidade/);
      assert.match(message, /Internet/);
      assert.match(message, /Cartão Lombongo/);
      assert.match(message, /Transporte/);
      assert.match(message, /45\.000 Kz/);
      assert.match(message, /135\.000 Kz/);
      assert.match(message, /28\/09\/2026/);
      assert.match(message, /Expenses Setembro 2026/);
      assert.equal(messageMentionsAttachment(message), false);
    }

    assert.match(pt, /Despesas pagas: 4/);
    assert.match(en, /Expenses paid: 4/);
    assert.match(fr, /Dépenses payées : 4/);
    assert.match(pt, /Estado: Pago/);
    assert.match(en, /Status: Paid/);
    assert.match(fr, /Statut : Payé/);
  });

  it("sends the edited bulk message and shortens a large selection", () => {
    const template = generateBulkPaidExpenseWhatsAppTemplate({
      expenses,
      totalLabel: "135.000 Kz",
      paymentDateLabel: "28/09/2026",
      paymentMethodLabel: "Transferência Bancária",
      locale: "pt",
    });
    const edited = `${template.message}\n\n— pagamento de Setembro`;
    const outbound = prepareOutboundWhatsAppMessage(edited);
    const many = Array.from({ length: MAX_WHATSAPP_EXPENSE_ITEMS + 17 }, (_, index) => ({
      description: `Expense ${index + 1}`,
      amountLabel: "1 Kz",
    }));
    const large = generateBulkPaidExpenseWhatsAppTemplate({
      expenses: many,
      totalLabel: "47 Kz",
      paymentDateLabel: "28/09/2026",
      paymentMethodLabel: "Cash",
      locale: "en",
    }).message;

    assert.equal(outbound.ok && outbound.message, edited);
    assert.match(large, /Expenses paid: 47/);
    assert.match(large, /Expense 1/);
    assert.match(large, /Expense 30/);
    assert.equal(large.includes("Expense 31"), false);
    assert.match(large, /\+17 other expenses/);
  });
});

describe("scoped bulk payments", () => {
  it("returns only the expenses inside the authorized project", () => {
    const summaries = summarizeScopedPayments(
      [
        line("pay-1", "2026-09-28", "a", "project-a", 45000),
        line("pay-1", "2026-09-28", "b", "project-a", 25000),
        line("pay-1", "2026-09-28", "c", "project-b", 50000),
      ],
      ["project-a"],
    );

    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.total, 70000);
    assert.equal(summaries[0]?.expenseCount, 2);
    assert.equal(summaries[0]?.includesAllExpenses, false);
    assert.deepEqual(summaries[0]?.expenses.map((expense) => expense.description), ["a", "b"]);
  });
});

describe("WaAPI message ids", () => {
  it("reads the serialized id from a successful action", () => {
    const ids = readWaapiMessageIds({
      status: "success",
      data: {
        status: "success",
        data: { _data: { id: { _serialized: "true_244@c.us_ABC", id: "ABC" } } },
      },
    });

    assert.equal(ids.messageId, "true_244@c.us_ABC");
    assert.equal(ids.referenceId, "ABC");
  });
});

function line(paymentId: string, paymentDate: string, description: string, projectId: string, amount: number) {
  return {
    paymentId,
    paymentDate,
    paymentMethod: "bank_transfer",
    paymentDescription: null,
    paymentCurrency: "KZ",
    paymentAmount: 120000,
    expenseId: description,
    description,
    projectId,
    amount,
    currency: "KZ",
  };
}
