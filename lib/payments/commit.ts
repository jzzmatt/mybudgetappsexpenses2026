import "server-only";

import { revalidatePath } from "next/cache";
import { resolveStoredEvidenceMimeType, validateEvidenceFile } from "@/lib/payments/rules";
import { downloadPaymentEvidenceFile, removePaymentEvidenceFile, uploadPaymentEvidenceFile } from "@/lib/payments/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EvidenceUpload = {
  evidenceType: "receipt" | "image";
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
};

export async function storePaymentEvidence(input: {
  userId: string;
  expenseId: string;
  projectId: string;
  files: EvidenceUpload[];
}) {
  const uploaded: string[] = [];
  const supabase = await createSupabaseServerClient();

  try {
    for (const file of input.files) {
      const storagePath = await uploadPaymentEvidenceFile({
        userId: input.userId,
        projectId: input.projectId,
        expenseId: input.expenseId,
        filename: file.filename,
        mimeType: file.mimeType,
        bytes: file.bytes,
      });
      uploaded.push(storagePath);

      const { error } = await supabase.from("expense_payment_evidence").insert({
        expense_id: input.expenseId,
        user_id: input.userId,
        evidence_type: file.evidenceType,
        storage_path: storagePath,
        file_name: file.filename,
        mime_type: file.mimeType,
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    await Promise.all(uploaded.map((path) => removePaymentEvidenceFile(path).catch(() => undefined)));
    if (uploaded.length > 0) {
      await supabase.from("expense_payment_evidence").delete().eq("user_id", input.userId).in("storage_path", uploaded);
    }

    throw error;
  }

  return uploaded;
}

export async function readEvidenceFiles(userId: string, expenseId: string, legacyPath: string | null, legacyName: string | null) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_payment_evidence")
    .select("id, storage_path, file_name, mime_type, evidence_type")
    .eq("user_id", userId)
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const files = data ?? [];
  const paths = new Set(files.map((file) => String(file.storage_path)));
  const selected = files.map((file) => ({
    storagePath: String(file.storage_path),
    fileName: String(file.file_name),
    mimeType: String(file.mime_type),
  }));

  if (legacyPath && !paths.has(legacyPath) && legacyPath.startsWith(`${userId}/`)) {
    selected.unshift({
      storagePath: legacyPath,
      fileName: legacyName || "payment-proof.pdf",
      mimeType: "application/pdf",
    });
  }

  const downloaded = [];

  for (const file of selected) {
    if (!file.storagePath.startsWith(`${userId}/`)) {
      throw new Error("evidence_forbidden");
    }

    downloaded.push({
      fileName: file.fileName,
      mimeType: file.mimeType,
      bytes: await downloadPaymentEvidenceFile(file.storagePath),
    });
  }

  return downloaded;
}

const EVIDENCE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PaymentEvidenceMeta = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  expenseId: string | null;
};

export async function listPaymentEvidenceMeta(userId: string, paymentId: string): Promise<PaymentEvidenceMeta[]> {
  if (!EVIDENCE_ID.test(paymentId)) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: lines, error: lineError } = await supabase
    .from("payment_expenses")
    .select("expense_id")
    .eq("user_id", userId)
    .eq("payment_id", paymentId);

  if (lineError) {
    throw new Error(lineError.message);
  }

  const expenseIds = (lines ?? []).map((row) => String(row.expense_id)).filter((id) => EVIDENCE_ID.test(id));
  const unique = new Map<string, PaymentEvidenceMeta>();

  if (expenseIds.length > 0) {
    const { data: paymentEvidence, error: paymentEvidenceError } = await supabase
      .from("expense_payment_evidence")
      .select("expense_id, storage_path, file_name, mime_type")
      .eq("user_id", userId)
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: true });

    if (paymentEvidenceError) {
      throw new Error(paymentEvidenceError.message);
    }

    addEvidenceRows(unique, userId, paymentEvidence ?? []);

    const { data: expenseEvidence, error: expenseEvidenceError } = await supabase
      .from("expense_payment_evidence")
      .select("expense_id, storage_path, file_name, mime_type")
      .eq("user_id", userId)
      .in("expense_id", expenseIds)
      .order("created_at", { ascending: true });

    if (expenseEvidenceError) {
      throw new Error(expenseEvidenceError.message);
    }

    addEvidenceRows(unique, userId, expenseEvidence ?? []);
  } else {
    const { data, error } = await supabase
      .from("expense_payment_evidence")
      .select("expense_id, storage_path, file_name, mime_type")
      .eq("user_id", userId)
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    addEvidenceRows(unique, userId, data ?? []);
  }

  const { data: legacyLines, error: legacyError } = await supabase
    .from("payment_expenses")
    .select("expense_id, expense:expenses(payment_proof_path, payment_proof_filename)")
    .eq("user_id", userId)
    .eq("payment_id", paymentId);

  if (legacyError) {
    throw new Error(legacyError.message);
  }

  for (const line of legacyLines ?? []) {
    const expense = Array.isArray(line.expense) ? line.expense[0] : line.expense;
    const storagePath = expense?.payment_proof_path ? String(expense.payment_proof_path) : "";

    if (!storagePath.startsWith(`${userId}/`) || unique.has(storagePath)) {
      continue;
    }

    const fileName = expense?.payment_proof_filename ? String(expense.payment_proof_filename) : "payment-proof.pdf";

    unique.set(storagePath, {
      storagePath,
      fileName,
      mimeType: resolveStoredEvidenceMimeType(fileName, "application/pdf"),
      expenseId: String(line.expense_id),
    });
  }

  return [...unique.values()];
}

function addEvidenceRows(
  unique: Map<string, PaymentEvidenceMeta>,
  userId: string,
  rows: { expense_id: string | null; storage_path: string; file_name: string; mime_type: string }[],
) {
  for (const row of rows) {
    const storagePath = String(row.storage_path);
    const fileName = String(row.file_name);

    if (!storagePath.startsWith(`${userId}/`) || unique.has(storagePath)) {
      continue;
    }

    unique.set(storagePath, {
      storagePath,
      fileName,
      mimeType: resolveStoredEvidenceMimeType(fileName, String(row.mime_type)),
      expenseId: row.expense_id ? String(row.expense_id) : null,
    });
  }
}

export async function readPaymentEvidenceFiles(userId: string, paymentId: string) {
  const files = await listPaymentEvidenceMeta(userId, paymentId);
  const downloaded = [];

  for (const file of files) {
    const bytes = await downloadPaymentEvidenceFile(file.storagePath);
    const mimeType = resolveStoredEvidenceMimeType(file.fileName, file.mimeType);

    if (bytes.length === 0) {
      throw new Error("download_failed");
    }

    if (mimeType !== "application/pdf" && !mimeType.startsWith("image/")) {
      throw new Error("unsupported_evidence");
    }

    downloaded.push({
      fileName: file.fileName,
      mimeType,
      bytes,
    });
  }

  return downloaded;
}

export function revalidateExpensePaths(projectId: string | null) {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/expenses`);
  }
}

export async function fileFromForm(value: FormDataEntryValue | null, kind: "receipt" | "image") {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const validated = validateEvidenceFile(kind, { name: value.name, type: value.type, size: value.size });

  if (!validated.ok) {
    return { error: validated.error } as const;
  }

  return {
    evidenceType: validated.evidenceType,
    filename: value.name,
    mimeType: validated.mimeType,
    bytes: new Uint8Array(await value.arrayBuffer()),
  } satisfies EvidenceUpload;
}
