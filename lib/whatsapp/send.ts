import "server-only";

import {
  buildWhatsAppDocumentPayload,
  buildWhatsAppImagePayload,
  buildWhatsAppTextPayload,
  isWhatsAppConfigured,
  planWhatsAppDelivery,
  sanitizeWhatsAppError,
} from "@/lib/whatsapp/payload";

type WhatsAppServerConfig = {
  token: string;
  phoneNumberId: string;
  version: string;
};

export function readWhatsAppServerConfig(env: NodeJS.ProcessEnv = process.env): WhatsAppServerConfig | null {
  const source = env as Record<string, string | undefined>;

  if (!isWhatsAppConfigured(source)) {
    return null;
  }

  return {
    token: source.WHATSAPP_ACCESS_TOKEN!.trim(),
    phoneNumberId: source.WHATSAPP_PHONE_NUMBER_ID!.trim(),
    version: source.WHATSAPP_API_VERSION?.trim() || "v22.0",
  };
}

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

  const text = await postMessage(fetchImpl, input.config, buildWhatsAppTextPayload(input.to, input.body));

  if (!text.ok) {
    return text;
  }

  const documents = input.files.filter((file) => file.mimeType === "application/pdf");
  const images = input.files.filter((file) => file.mimeType.startsWith("image/"));

  for (const file of [...documents, ...images]) {
    const mediaId = await uploadMedia(fetchImpl, input.config, file);

    if (!mediaId.ok) {
      return mediaId;
    }

    const payload =
      file.mimeType === "application/pdf"
        ? buildWhatsAppDocumentPayload(input.to, mediaId.id, file.fileName)
        : buildWhatsAppImagePayload(input.to, mediaId.id);
    const sent = await postMessage(fetchImpl, input.config, payload);

    if (!sent.ok) {
      return sent;
    }
  }

  return { ok: true as const };
}

async function postMessage(fetchImpl: typeof fetch, config: WhatsAppServerConfig, payload: unknown) {
  const response = await fetchImpl(graphUrl(config, "messages"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = sanitizeWhatsAppError(await response.text());
    console.error("whatsapp message failed", detail);
    return { ok: false as const, error: "send_failed" };
  }

  return { ok: true as const };
}

async function uploadMedia(
  fetchImpl: typeof fetch,
  config: WhatsAppServerConfig,
  file: { fileName: string; mimeType: string; bytes: Uint8Array },
) {
  const body = new FormData();
  body.append("messaging_product", "whatsapp");
  body.append("type", file.mimeType);
  body.append("file", new Blob([Buffer.from(file.bytes)], { type: file.mimeType }), file.fileName);

  const response = await fetchImpl(graphUrl(config, "media"), {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body,
  });

  if (!response.ok) {
    const detail = sanitizeWhatsAppError(await response.text());
    console.error("whatsapp media failed", detail);
    return { ok: false as const, error: "send_failed" };
  }

  const payload = (await response.json()) as { id?: string };

  if (!payload.id) {
    return { ok: false as const, error: "send_failed" };
  }

  return { ok: true as const, id: payload.id };
}

function graphUrl(config: WhatsAppServerConfig, resource: "messages" | "media") {
  return `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/${resource}`;
}
