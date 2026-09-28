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
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const plan = planWhatsAppDelivery(input.files);

  if (plan.unsupported.length > 0) {
    return { ok: false as const, error: "unsupported_evidence" };
  }

  const text = await postAction(fetchImpl, input.config, "send-message", buildWaapiTextPayload(input.to, input.body));

  if (!text.ok) {
    return text;
  }

  let referenceId = text.referenceId;
  const documents = input.files.filter((file) => file.mimeType === "application/pdf");
  const images = input.files.filter((file) => file.mimeType.startsWith("image/"));
  const mediaFiles = [...documents, ...images];
  let attachmentsSent = 0;

  if (mediaFiles.length > 0) {
    await pause(650);
  }

  for (const file of mediaFiles) {
    const sent = await postAction(fetchImpl, input.config, "send-media", buildWaapiMediaPayload(input.to, file));

    if (!sent.ok) {
      return sent;
    }

    attachmentsSent += 1;

    if (!referenceId && sent.messageId) {
      referenceId = sent.messageId;
    }
  }

  if (input.files.length > 0 && attachmentsSent !== input.files.length) {
    return { ok: false as const, error: "send_failed" };
  }

  return { ok: true as const, messageId: text.messageId, referenceId, attachmentsSent };
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
    return { ok: false as const, error: "send_failed" };
  }

  const ids = readWaapiMessageIds(body);
  return { ok: true as const, messageId: ids.messageId, referenceId: ids.referenceId };
}
