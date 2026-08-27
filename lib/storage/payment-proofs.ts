import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";
export const MAX_PDF_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates file buffer, size and MIME type for payment proof PDFs.
 */
export function validatePaymentProofFile(file: File | Blob, filename: string): { valid: boolean; error?: string } {
  if (file.size > MAX_PDF_FILE_SIZE_BYTES) {
    return { valid: false, error: "File size exceeds the 10MB limit." };
  }

  const isPdfMime = file.type === "application/pdf" || file.type === "";
  const isPdfExt = filename.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    return { valid: false, error: "Only PDF files are supported for payment proofs." };
  }

  return { valid: true };
}

/**
 * Generates an access-controlled, non-guessable storage path scoped by user and project.
 * Structure: {user_id}/{project_id}/{timestamp}_{random}.pdf
 */
export function generatePaymentProofStoragePath(userId: string, projectId: string, originalFilename: string): string {
  const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  return `${userId}/${projectId}/${timestamp}_${randomSuffix}_${cleanFilename}`;
}

/**
 * Uploads a payment proof PDF to the private Supabase Storage bucket.
 */
export async function uploadPaymentProofToStorage(
  projectId: string,
  fileBuffer: ArrayBuffer | Uint8Array,
  filename: string,
): Promise<{ path: string; filename: string }> {
  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();

  const storagePath = generatePaymentProofStoragePath(userId, projectId, filename);

  const { error } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    console.error("Payment proof upload error:", error);
    throw new Error(`Failed to upload payment proof to storage: ${error.message}`);
  }

  return {
    path: storagePath,
    filename,
  };
}

/**
 * Generates a short-lived signed URL (e.g. 1 hour) for viewing or downloading a private payment proof.
 */
export async function getPaymentProofSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  try {
    await ensureUserRecord();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.error("Failed to generate signed URL:", error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (err) {
    console.error("Error creating payment proof signed URL:", err);
    return null;
  }
}
