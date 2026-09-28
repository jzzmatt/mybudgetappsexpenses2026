import { resolveWaapiChatId } from "@/lib/whatsapp/chat-id";
import {
  buildWaapiMediaPayload,
  buildWaapiTextPayload,
  planWhatsAppDelivery,
  readWaapiMessageIds,
  sanitizeWhatsAppError,
  waapiActionAccepted,
  waapiActionUrl,
  type WaapiActionBody,
} from "@/lib/whatsapp/payload";

export type WhatsAppServerConfig = {
  token: string;
  instanceId: string;
};

export async function deliverPaidExpenseWhatsApp(input: {
  to: string;
  body: string;
  files: { fileName: string; mimeType: string; bytes: Uint8Array }[];
  config: WhatsAppServerConfig;
  fetchImpl?: typeof fetch;
  receiptsOnly?: boolean;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const plan = planWhatsAppDelivery(input.files);

  if (plan.unsupported.length > 0) {
    return { ok: false as const, error: "unsupported_evidence" as const };
  }

  const chatId = await resolveWaapiChatId(fetchImpl, input.config, input.to);
  let messageId: string | null = null;
  let referenceId: string | null = null;
  let textSent = false;

  if (!input.receiptsOnly) {
    const text = await postAction(fetchImpl, input.config, "send-message", buildWaapiTextPayload(chatId, input.body));

    if (!text.ok) {
      return text;
    }

    textSent = true;
    messageId = text.messageId;
    referenceId = text.referenceId;
  }

  const mediaResult = await deliverMediaFiles(fetchImpl, input.config, chatId, input.files, messageId);

  if (!mediaResult.ok) {
    if (textSent) {
      return {
        ok: false as const,
        error: "receipt_send_failed" as const,
        textSent: true as const,
        messageId,
        referenceId,
        attachmentsSent: mediaResult.attachmentsSent,
      };
    }

    return mediaResult;
  }

  if (input.files.length > 0 && mediaResult.attachmentsSent !== input.files.length) {
    if (textSent) {
      return {
        ok: false as const,
        error: "receipt_send_failed" as const,
        textSent: true as const,
        messageId,
        referenceId,
        attachmentsSent: mediaResult.attachmentsSent,
      };
    }

    return { ok: false as const, error: "send_failed" as const };
  }

  return {
    ok: true as const,
    messageId,
    referenceId,
    attachmentsSent: mediaResult.attachmentsSent,
    textSent: !input.receiptsOnly,
  };
}

async function deliverMediaFiles(
  fetchImpl: typeof fetch,
  config: WhatsAppServerConfig,
  chatId: string,
  files: { fileName: string; mimeType: string; bytes: Uint8Array }[],
  replyToMessageId: string | null,
) {
  const documents = files.filter((file) => file.mimeType === "application/pdf");
  const images = files.filter((file) => file.mimeType.startsWith("image/"));
  const mediaFiles = [...documents, ...images];
  let attachmentsSent = 0;

  if (mediaFiles.length > 0) {
    await pause(650);
  }

  for (const file of mediaFiles) {
    const payload = buildWaapiMediaPayload(chatId, file);

    if (replyToMessageId) {
      Object.assign(payload, { replyToMessageId });
    }

    const sent = await postAction(fetchImpl, config, "send-media", payload);

    if (!sent.ok) {
      return { ok: false as const, error: sent.error, attachmentsSent };
    }

    attachmentsSent += 1;
  }

  return { ok: true as const, attachmentsSent };
}

function pause(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function postAction(
  fetchImpl: typeof fetch,
  config: WhatsAppServerConfig,
  action: "send-message" | "send-media",
  payload: unknown,
) {
  const response = await fetchImpl(waapiActionUrl(config.instanceId, action), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let body: WaapiActionBody | null = null;

  try {
    body = raw ? (JSON.parse(raw) as WaapiActionBody) : null;
  } catch {
    body = null;
  }

  if (!response.ok || !waapiActionAccepted(body)) {
    console.error("whatsapp action failed", sanitizeWhatsAppError(raw, config.token));
    return { ok: false as const, error: "send_failed" as const };
  }

  const ids = readWaapiMessageIds(body);
  return { ok: true as const, messageId: ids.messageId, referenceId: ids.referenceId };
}
