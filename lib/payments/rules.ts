export const PAYMENT_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

const RECEIPT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const PICTURE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function shouldConfirmPayment(previousStatus: string, nextStatus: string) {
  return nextStatus === "paid" && previousStatus !== "paid";
}

export function canSharePaidExpense(status: string) {
  return status === "paid";
}

export function needsEvidenceWarning(hasReceipt: boolean, hasPicture: boolean) {
  return !hasReceipt && !hasPicture;
}

export function normalizePaymentNote(value: string) {
  return value.trim().slice(0, 500);
}

export function isPaymentDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function buildPaidExpenseUpdate(input: {
  paidAt: string;
  paymentMethod: string | null;
  paymentNote: string | null;
}) {
  return {
    status: "paid" as const,
    paid_at: input.paidAt,
    payment_method: input.paymentMethod,
    payment_note: input.paymentNote,
  };
}

export function paymentAccess(ownerUserId: string | null | undefined, sessionUserId: string) {
  if (!ownerUserId || ownerUserId !== sessionUserId) {
    return "not_found" as const;
  }

  return "allowed" as const;
}

export function validateEvidenceFile(kind: "receipt" | "image", file: { name: string; type: string; size: number }) {
  if (file.size <= 0) {
    return { ok: false as const, error: "empty" };
  }

  if (file.size > PAYMENT_EVIDENCE_MAX_BYTES) {
    return { ok: false as const, error: "too_large" };
  }

  const extension = extensionOf(file.name);
  const allowed = kind === "receipt" ? RECEIPT_TYPES : PICTURE_TYPES;
  const mime = file.type.trim().toLowerCase();
  const matchedMime = Object.entries(allowed).find(([, extensions]) => extensions.includes(extension));

  if (!matchedMime) {
    return { ok: false as const, error: "type" };
  }

  if (mime && mime !== matchedMime[0] && !(mime === "image/jpg" && matchedMime[0] === "image/jpeg")) {
    return { ok: false as const, error: "type" };
  }

  return {
    ok: true as const,
    mimeType: matchedMime[0],
    evidenceType: kind === "image" ? ("image" as const) : ("receipt" as const),
  };
}

export function evidenceStorageKind(mimeType: string) {
  if (mimeType === "application/pdf") {
    return "document" as const;
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp") {
    return "image" as const;
  }

  return "unsupported" as const;
}

export function safeEvidenceFileName(filename: string) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 80) || "evidence";
}

function extensionOf(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}
