import { safeEvidenceFileName } from "@/lib/payments/rules";
import { PAYMENT_PROOFS_BUCKET } from "@/lib/storage/payment-proofs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function evidenceObjectPath(userId: string, projectId: string, expenseId: string, filename: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `${userId}/${projectId}/${expenseId}/${Date.now()}_${randomSuffix}_${safeEvidenceFileName(filename)}`;
}

export async function uploadPaymentEvidenceFile(input: {
  userId: string;
  projectId: string;
  expenseId: string;
  filename: string;
  mimeType: string;
  bytes: ArrayBuffer | Uint8Array;
}) {
  const supabase = await createSupabaseServerClient();
  const storagePath = evidenceObjectPath(input.userId, input.projectId, input.expenseId, input.filename);
  const { error } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(storagePath, input.bytes, {
    contentType: input.mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error("upload_failed");
  }

  return storagePath;
}

export async function removePaymentEvidenceFile(storagePath: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([storagePath]);
}

export async function downloadPaymentEvidenceFile(storagePath: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).download(storagePath);

  if (error || !data) {
    throw new Error("download_failed");
  }

  return new Uint8Array(await data.arrayBuffer());
}
