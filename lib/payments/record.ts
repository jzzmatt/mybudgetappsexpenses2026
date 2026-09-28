import "server-only";

import { randomUUID } from "node:crypto";
import { evaluatePaymentSelection, payableAmount, paymentErrorCode, type PaymentCandidate } from "@/lib/payments/bulk";
import { isPaymentDate } from "@/lib/payments/rules";
import { removePaymentEvidenceFile, uploadEvidenceObjects } from "@/lib/payments/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EXPENSE_PAYMENT_METHODS } from "@/lib/expenses/types";

export type PaymentEvidenceInput = {
  evidenceType: "receipt" | "image";
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
};

type RecordedPayment = {
  paymentId: string;
  count: number;
  total: number;
  currency: string;
};

export async function recordExpensePayment(input: {
  userId: string;
  expenseIds: string[];
  paidAt: string;
  paymentMethod: string | null;
  description: string | null;
  files: PaymentEvidenceInput[];
}) {
  const ids = [...new Set(input.expenseIds)];

  if (!isPaymentDate(input.paidAt)) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  if (input.paymentMethod && !EXPENSE_PAYMENT_METHODS.includes(input.paymentMethod as (typeof EXPENSE_PAYMENT_METHODS)[number])) {
    return { ok: false as const, error: "invalid_selection" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error: readError } = await supabase
    .from("expenses")
    .select("id, user_id, status, currency, budget_amount, paid_amount, project_id")
    .eq("user_id", input.userId)
    .in("id", ids);

  if (readError) {
    return { ok: false as const, error: "failed" as const };
  }

  const candidates: PaymentCandidate[] = (rows ?? []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    status: String(row.status),
    currency: String(row.currency),
    amount: payableAmount(Number(row.paid_amount), Number(row.budget_amount)),
  }));
  const decision = evaluatePaymentSelection(ids, candidates, input.userId);

  if (!decision.ok) {
    return decision;
  }

  const projectIds = [...new Set((rows ?? []).map((row) => (row.project_id ? String(row.project_id) : "")).filter(Boolean))];
  const projectId = projectIds.length === 1 ? projectIds[0] : "shared";
  let uploaded: { storagePath: string; fileName: string; mimeType: string; evidenceType: "receipt" | "image" }[] = [];

  try {
    uploaded = await uploadEvidenceObjects({
      userId: input.userId,
      projectId: projectId || "shared",
      folderId: randomUUID(),
      files: input.files,
    });
  } catch {
    return { ok: false as const, error: "upload_failed" as const };
  }

  const { data, error } = await supabase.rpc("record_expense_payment", {
    p_expense_ids: decision.ids,
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

  const payload = data as RecordedPayment | null;

  if (!payload?.paymentId) {
    await Promise.all(uploaded.map((file) => removePaymentEvidenceFile(file.storagePath).catch(() => undefined)));
    return { ok: false as const, error: "failed" as const };
  }

  return {
    ok: true as const,
    paymentId: String(payload.paymentId),
    count: Number(payload.count),
    total: Number(payload.total),
    currency: String(payload.currency),
    projectIds,
  };
}
