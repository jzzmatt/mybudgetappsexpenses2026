import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isExpenseCurrency } from "@/lib/currency/types";
import { formatCurrency } from "@/lib/currency/format";
import type { Locale } from "@/lib/i18n/config";
import { renderPaymentNotification, type PaymentBatchPreview } from "@/lib/notifications/composer";
import { sendWhatsAppNotification } from "@/lib/notifications/whatsapp-channel";
import { paymentErrorCode } from "@/lib/payments/bulk";
import { fileFromForm, listPaymentEvidenceMeta, readPaymentEvidenceFiles, revalidateExpensePaths } from "@/lib/payments/commit";
import { isPaymentDate } from "@/lib/payments/rules";
import { removePaymentEvidenceFile, uploadEvidenceObjects } from "@/lib/payments/storage";
import type { PaymentEvidenceInput } from "@/lib/payments/record";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EXPENSE_PAYMENT_METHODS } from "@/lib/expenses/types";
import { formatWhatsAppDate, prepareOutboundWhatsAppMessage } from "@/lib/whatsapp/message";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPaymentUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export async function openPaymentBatch(userId: string, expenseIds: string[], idempotencyKey: string) {
  const ids = [...new Set(expenseIds)].filter((id) => isPaymentUuid(id));

  if (!isPaymentUuid(idempotencyKey) || ids.length !== new Set(expenseIds).size || ids.length < 1) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("open_payment_batch", {
    p_expense_ids: ids,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { ok: false as const, error: paymentErrorCode(error.message) };
  }

  const paymentId = String((data as { paymentId?: string } | null)?.paymentId ?? "");

  if (!isPaymentUuid(paymentId)) {
    return { ok: false as const, error: "failed" as const };
  }

  return { ok: true as const, paymentId };
}

export async function loadPaymentBatchPreview(
  userId: string,
  paymentId: string,
  locale: Locale,
  extraAttachments = 0,
): Promise<PaymentBatchPreview | null> {
  if (!isPaymentUuid(paymentId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, reference, batch_status, amount, currency, expense_count, project_id")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !payment) {
    return null;
  }

  const { data: lines, error: lineError } = await supabase
    .from("payment_expenses")
    .select("amount, expense:expenses(id, description, status, date, currency, vendor:vendors(name), category:categories(name))")
    .eq("payment_id", paymentId)
    .eq("user_id", userId);

  if (lineError || !lines) {
    return null;
  }

  const expenses = lines.flatMap((line) => {
    const expense = Array.isArray(line.expense) ? line.expense[0] : line.expense;

    if (!expense) {
      return [];
    }

    return [{
      id: String(expense.id),
      description: String(expense.description ?? ""),
      amount: Number(line.amount),
      currency: String(expense.currency ?? payment.currency),
      category: relationName(expense.category),
      vendor: relationName(expense.vendor),
      date: String(expense.date ?? ""),
      status: String(expense.status ?? ""),
    }];
  });

  const evidence = await listPaymentEvidenceMeta(userId, paymentId);
  const evidenceExpenseIds = new Set(evidence.flatMap((file) => (file.expenseId ? [file.expenseId] : [])));
  const attachmentCount = evidence.length + Math.max(0, extraAttachments);
  const views = expenses.map((expense) => ({
    ...expense,
    hasEvidence: evidenceExpenseIds.has(expense.id),
  }));

  return {
    paymentId,
    reference: String(payment.reference ?? ""),
    batchStatus: String(payment.batch_status ?? ""),
    currency: String(payment.currency),
    total: Number(payment.amount),
    expenseCount: views.length,
    attachmentCount,
    expenses: views,
    message: renderPaymentNotification({
      reference: String(payment.reference ?? ""),
      totalLabel: money(Number(payment.amount), String(payment.currency), locale),
      attachmentCount,
      locale,
      expenses: views.map((expense) => ({
        description: expense.description,
        amountLabel: money(expense.amount, expense.currency, locale),
        category: expense.category,
        dateLabel: formatWhatsAppDate(expense.date),
      })),
    }),
  };
}

export async function removePaymentBatchExpense(userId: string, paymentId: string, expenseId: string) {
  if (!isPaymentUuid(paymentId) || !isPaymentUuid(expenseId)) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_payment_batch_expense", {
    p_payment_id: paymentId,
    p_expense_id: expenseId,
  });

  if (error) {
    return { ok: false as const, error: paymentErrorCode(error.message) };
  }

  revalidatePaymentViews(null);
  return { ok: true as const };
}

export async function cancelPaymentBatch(userId: string, paymentId: string) {
  if (!isPaymentUuid(paymentId)) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_payment_batch", { p_payment_id: paymentId });

  if (error) {
    return { ok: false as const, error: paymentErrorCode(error.message) };
  }

  revalidatePaymentViews(null);
  return { ok: true as const };
}

export async function readBatchNotificationForm(form: FormData) {
  const phone = String(form.get("phone") ?? "");
  const message = String(form.get("message") ?? "");
  const idempotencyKey = String(form.get("idempotencyKey") ?? "");
  const paidAt = String(form.get("paid_at") ?? "");
  const paymentMethod = String(form.get("payment_method") ?? "");
  const description = String(form.get("payment_note") ?? "");
  const receipt = await fileFromForm(form.get("receipt"), "receipt");
  const picture = await fileFromForm(form.get("picture"), "image");

  if ((receipt && "error" in receipt) || (picture && "error" in picture)) {
    return { ok: false as const, error: "invalid_evidence" as const };
  }

  if (!isPaymentUuid(idempotencyKey)) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const files = [receipt, picture].flatMap((file) => (file && !("error" in file) ? [file] : []));

  return {
    ok: true as const,
    phone,
    message,
    idempotencyKey,
    paidAt,
    paymentMethod: paymentMethod || null,
    description: description || null,
    files,
  };
}

export async function confirmPaymentBatch(input: {
  userId: string;
  paymentId: string;
  paidAt: string;
  paymentMethod: string | null;
  description: string | null;
  files: PaymentEvidenceInput[];
}) {
  if (!isPaymentUuid(input.paymentId) || !isPaymentDate(input.paidAt)) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  if (input.paymentMethod && !EXPENSE_PAYMENT_METHODS.includes(input.paymentMethod as (typeof EXPENSE_PAYMENT_METHODS)[number])) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data: payment, error: readError } = await supabase
    .from("payments")
    .select("id, batch_status, project_id")
    .eq("id", input.paymentId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (readError || !payment) {
    return { ok: false as const, error: "not_found" as const };
  }

  if (String(payment.batch_status) === "paid") {
    return { ok: true as const, alreadyPaid: true };
  }

  if (!["draft", "pending"].includes(String(payment.batch_status))) {
    return { ok: false as const, error: "selection_changed" as const };
  }

  const projectId = payment.project_id ? String(payment.project_id) : "shared";
  let uploaded: { storagePath: string; fileName: string; mimeType: string; evidenceType: "receipt" | "image" }[] = [];

  try {
    uploaded = await uploadEvidenceObjects({
      userId: input.userId,
      projectId,
      folderId: randomUUID(),
      files: input.files,
    });
  } catch {
    return { ok: false as const, error: "upload_failed" as const };
  }

  const { error } = await supabase.rpc("confirm_payment_batch", {
    p_payment_id: input.paymentId,
    p_payment_date: input.paidAt,
    p_payment_method: input.paymentMethod,
    p_description: input.description,
    p_evidence: uploaded.map((file) => ({
      storage_path: file.storagePath,
      file_name: file.fileName,
      mime_type: file.mimeType,
      evidence_type: file.evidenceType,
    })),
  });

  if (error) {
    await Promise.all(uploaded.map((file) => removePaymentEvidenceFile(file.storagePath).catch(() => undefined)));
    return { ok: false as const, error: paymentErrorCode(error.message) };
  }

  revalidatePaymentViews(payment.project_id ? String(payment.project_id) : null);
  return { ok: true as const, alreadyPaid: false };
}

export async function dispatchBatchNotification(input: {
  userId: string;
  paymentId: string;
  phone: string;
  message: string;
  idempotencyKey: string;
  files: PaymentEvidenceInput[];
}) {
  if (!isPaymentUuid(input.paymentId) || !isPaymentUuid(input.idempotencyKey)) {
    return { ok: false as const, error: "invalid_selection" as const, notificationStatus: "not_attempted" as const };
  }

  const phone = normalizeWhatsAppNumber(input.phone);

  if (!phone.ok) {
    return { ok: false as const, error: "invalid_phone" as const, notificationStatus: "not_attempted" as const };
  }

  const outbound = prepareOutboundWhatsAppMessage(input.message);

  if (!outbound.ok) {
    return {
      ok: false as const,
      error: outbound.error === "too_long" ? ("message_too_long" as const) : ("message_empty" as const),
      notificationStatus: "not_attempted" as const,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, batch_status, project_id")
    .eq("id", input.paymentId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (paymentError || !payment || String(payment.batch_status) === "cancelled") {
    return { ok: false as const, error: "not_found" as const, notificationStatus: "not_attempted" as const };
  }

  const existing = await findActiveShareLog(input.userId, input.paymentId, input.idempotencyKey);

  if (existing?.status === "sent") {
    return {
      ok: true as const,
      notificationStatus: "sent" as const,
      duplicate: true,
      messageId: existing.waapi_message_id,
      referenceId: existing.waapi_reference_id,
    };
  }

  if (existing?.status === "pending") {
    return { ok: false as const, error: "in_progress" as const, notificationStatus: "not_attempted" as const };
  }

  const projectId = payment.project_id ? String(payment.project_id) : "shared";
  let uploaded: { storagePath: string; fileName: string; mimeType: string; evidenceType: "receipt" | "image" }[] = [];

  if (input.files.length > 0) {
    try {
      uploaded = await uploadEvidenceObjects({
        userId: input.userId,
        projectId,
        folderId: randomUUID(),
        files: input.files,
      });
    } catch {
      return { ok: false as const, error: "upload_failed" as const, notificationStatus: "failed" as const };
    }

    const { count } = await supabase
      .from("payment_expenses")
      .select("expense_id", { count: "exact", head: true })
      .eq("payment_id", input.paymentId)
      .eq("user_id", input.userId);
    const { data: onlyExpense } = count === 1
      ? await supabase.from("payment_expenses").select("expense_id").eq("payment_id", input.paymentId).eq("user_id", input.userId).maybeSingle()
      : { data: null };
    const { error: evidenceError } = await supabase.from("expense_payment_evidence").insert(uploaded.map((file) => ({
      payment_id: input.paymentId,
      expense_id: onlyExpense?.expense_id ? String(onlyExpense.expense_id) : null,
      user_id: input.userId,
      evidence_type: file.evidenceType,
      storage_path: file.storagePath,
      file_name: file.fileName,
      mime_type: file.mimeType,
    })));

    if (evidenceError) {
      await Promise.all(uploaded.map((file) => removePaymentEvidenceFile(file.storagePath).catch(() => undefined)));
      return { ok: false as const, error: "upload_failed" as const, notificationStatus: "failed" as const };
    }
  }

  let files: { fileName: string; mimeType: string; bytes: Uint8Array }[];
  let expectedEvidenceCount = 0;

  try {
    expectedEvidenceCount = (await listPaymentEvidenceMeta(input.userId, input.paymentId)).length;
    files = await readPaymentEvidenceFiles(input.userId, input.paymentId);

    if (expectedEvidenceCount > 0 && files.length !== expectedEvidenceCount) {
      throw new Error("unavailable");
    }
  } catch {
    await recordShareLog({
      userId: input.userId,
      paymentId: input.paymentId,
      phone: phone.display,
      message: outbound.message,
      idempotencyKey: input.idempotencyKey,
      status: "failed",
      errorMessage: "unavailable",
      attachmentCount: 0,
    });
    await markBatchPending(input.userId, input.paymentId);
    return { ok: false as const, error: "unavailable" as const, notificationStatus: "failed" as const };
  }

  const pending = await recordShareLog({
    userId: input.userId,
    paymentId: input.paymentId,
    phone: phone.display,
    message: outbound.message,
    idempotencyKey: input.idempotencyKey,
    status: "pending",
    errorMessage: null,
    attachmentCount: files.length,
  });

  if (!pending.ok || !("id" in pending)) {
    return pending;
  }

  const sent = await sendWhatsAppNotification({
    to: phone.e164,
    message: outbound.message,
    files,
  });
  const receiptsMissing = sent.ok
    && expectedEvidenceCount > 0
    && sent.attachmentsSent !== expectedEvidenceCount;

  await supabase
    .from("expense_share_logs")
    .update({
      status: sent.ok && !receiptsMissing ? "sent" : "failed",
      error_message: !sent.ok ? sent.error : receiptsMissing ? "receipt_send_failed" : null,
      sent_at: sent.ok && !receiptsMissing ? new Date().toISOString() : null,
      waapi_message_id: sent.ok && !receiptsMissing ? sent.messageId : null,
      waapi_reference_id: sent.ok && !receiptsMissing ? sent.referenceId : null,
      metadata: { idempotencyKey: input.idempotencyKey, attachmentCount: files.length },
    })
    .eq("id", pending.id)
    .eq("user_id", input.userId);

  await markBatchPending(input.userId, input.paymentId);
  revalidatePaymentViews(payment.project_id ? String(payment.project_id) : null);

  if (!sent.ok || receiptsMissing) {
    return {
      ok: false as const,
      error: receiptsMissing ? "receipt_send_failed" : sent.error,
      notificationStatus: "failed" as const,
    };
  }

  return {
    ok: true as const,
    notificationStatus: "sent" as const,
    duplicate: false,
    messageId: sent.messageId,
    referenceId: sent.referenceId,
    attachmentCount: files.length,
  };
}

async function findActiveShareLog(userId: string, paymentId: string, idempotencyKey: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("expense_share_logs")
    .select("id, status, waapi_message_id, waapi_reference_id")
    .eq("user_id", userId)
    .eq("payment_id", paymentId)
    .contains("metadata", { idempotencyKey })
    .in("status", ["pending", "sent"])
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    status: String(data.status),
    waapi_message_id: data.waapi_message_id ? String(data.waapi_message_id) : null,
    waapi_reference_id: data.waapi_reference_id ? String(data.waapi_reference_id) : null,
  };
}

async function recordShareLog(input: {
  userId: string;
  paymentId: string;
  phone: string;
  message: string;
  idempotencyKey: string;
  status: "pending" | "failed";
  errorMessage: string | null;
  attachmentCount: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_share_logs")
    .insert({
      payment_id: input.paymentId,
      user_id: input.userId,
      recipient_phone: input.phone.startsWith("+") ? input.phone : `+${input.phone}`,
      channel: "whatsapp",
      message: input.message,
      status: input.status,
      error_message: input.errorMessage,
      metadata: { idempotencyKey: input.idempotencyKey, attachmentCount: input.attachmentCount },
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const existing = await findActiveShareLog(input.userId, input.paymentId, input.idempotencyKey);

    if (existing?.status === "sent") {
      return {
        ok: true as const,
        notificationStatus: "sent" as const,
        duplicate: true,
        messageId: existing.waapi_message_id,
        referenceId: existing.waapi_reference_id,
      };
    }

    return { ok: false as const, error: "in_progress" as const, notificationStatus: "not_attempted" as const };
  }

  if (error || !data) {
    return { ok: false as const, error: "failed" as const, notificationStatus: "failed" as const };
  }

  return { ok: true as const, id: String(data.id) };
}

async function markBatchPending(userId: string, paymentId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("payments")
    .update({ batch_status: "pending" })
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("batch_status", "draft");
}

function revalidatePaymentViews(projectId: string | null) {
  revalidateExpensePaths(projectId);
  revalidatePath("/payments");
  revalidatePath("/notifications");
}

function relationName(value: { name?: string } | { name?: string }[] | null | undefined) {
  if (!value) {
    return "";
  }

  const row = Array.isArray(value) ? value[0] : value;
  return row?.name ? String(row.name) : "";
}

function money(amount: number, currency: string, locale: Locale) {
  if (!isExpenseCurrency(currency)) {
    return `${amount.toFixed(2)} ${currency}`;
  }

  return formatCurrency(amount, currency, locale);
}
