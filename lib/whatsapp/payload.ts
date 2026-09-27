export type WhatsAppEvidenceFile = {
  fileName: string;
  mimeType: string;
};

export const WAAPI_API_BASE = "https://waapi.app/api/v1";

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

export function waapiChatId(digits: string) {
  return `${digits}@c.us`;
}

export function waapiActionUrl(instanceId: string, action: "send-message" | "send-media") {
  return `${WAAPI_API_BASE}/instances/${instanceId}/client/action/${action}`;
}

export function buildWaapiTextPayload(digits: string, message: string) {
  return {
    chatId: waapiChatId(digits),
    message,
  };
}

export function waapiSendAsDocument(mimeType: string) {
  return mimeType === "application/pdf" || mimeType === "image/webp";
}

export function buildWaapiMediaPayload(
  digits: string,
  file: { fileName: string; mimeType: string; bytes: Uint8Array },
) {
  return {
    chatId: waapiChatId(digits),
    mediaBase64: Buffer.from(file.bytes).toString("base64"),
    mediaName: file.fileName,
    asDocument: waapiSendAsDocument(file.mimeType),
  };
}

export type WaapiActionBody = {
  status?: string;
  data?: { status?: string };
};

export function waapiActionAccepted(payload: WaapiActionBody | null | undefined) {
  return payload?.status === "success" && payload.data?.status === "success";
}

export function isWhatsAppConfigured(env: { WAAPI_API_TOKEN?: string; WAAPI_INSTANCE_ID?: string }) {
  const token = env.WAAPI_API_TOKEN?.trim() ?? "";
  const instanceId = env.WAAPI_INSTANCE_ID?.trim() ?? "";
  return token.length > 0 && /^\d+$/.test(instanceId);
}

export function publicWhatsAppStatus(configured: boolean) {
  return { configured };
}

export function sanitizeWhatsAppError(message: string, token?: string) {
  let sanitized = message.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/EAA[A-Za-z0-9]+/g, "[redacted]");

  if (token) {
    sanitized = sanitized.split(token).join("[redacted]");
  }

  return sanitized.slice(0, 300);
}
