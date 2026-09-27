export type WhatsAppEvidenceFile = {
  fileName: string;
  mimeType: string;
};

export function planWhatsAppDelivery(files: WhatsAppEvidenceFile[]) {
  const documents = files.filter((file) => file.mimeType === "application/pdf");
  const images = files.filter((file) => file.mimeType.startsWith("image/"));
  const unsupported = files.filter((file) => file.mimeType !== "application/pdf" && !file.mimeType.startsWith("image/"));

  return {
    steps: [
      { type: "text" as const },
      ...documents.map((file) => ({ type: "document" as const, fileName: file.fileName })),
      ...images.map((file) => ({ type: "image" as const, fileName: file.fileName })),
    ],
    unsupported,
  };
}

export function buildWhatsAppTextPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp" as const,
    to,
    type: "text" as const,
    text: { body },
  };
}

export function buildWhatsAppDocumentPayload(to: string, mediaId: string, filename: string) {
  return {
    messaging_product: "whatsapp" as const,
    to,
    type: "document" as const,
    document: { id: mediaId, filename },
  };
}

export function buildWhatsAppImagePayload(to: string, mediaId: string) {
  return {
    messaging_product: "whatsapp" as const,
    to,
    type: "image" as const,
    image: { id: mediaId },
  };
}

export function isWhatsAppConfigured(env: { WHATSAPP_ACCESS_TOKEN?: string; WHATSAPP_PHONE_NUMBER_ID?: string }) {
  return Boolean(env.WHATSAPP_ACCESS_TOKEN?.trim() && env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export function publicWhatsAppStatus(configured: boolean) {
  return { configured };
}

export function sanitizeWhatsAppError(message: string) {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/EAA[A-Za-z0-9]+/g, "[redacted]")
    .slice(0, 300);
}
