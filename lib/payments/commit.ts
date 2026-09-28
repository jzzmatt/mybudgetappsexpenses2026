import "server-only";

import { revalidatePath } from "next/cache";
import { validateEvidenceFile } from "@/lib/payments/rules";
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

export async function readPaymentEvidenceFiles(userId: string, paymentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expense_payment_evidence")
    .select("storage_path, file_name, mime_type")
    .eq("user_id", userId)
    .eq("payment_id", paymentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const downloaded = [];

  for (const file of data ?? []) {
    const storagePath = String(file.storage_path);

    if (!storagePath.startsWith(`${userId}/`)) {
      throw new Error("evidence_forbidden");
    }

    downloaded.push({
      fileName: String(file.file_name),
      mimeType: String(file.mime_type),
      bytes: await downloadPaymentEvidenceFile(storagePath),
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
