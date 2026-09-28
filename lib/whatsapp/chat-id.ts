import { sanitizeWhatsAppError, waapiActionUrl, waapiChatId } from "@/lib/whatsapp/payload";

type WhatsAppServerConfig = {
  token: string;
  instanceId: string;
};

type GetNumberIdBody = {
  status?: string;
  data?: {
    status?: string;
    data?: {
      numberId?: { _serialized?: string };
    };
  };
};

export async function resolveWaapiChatId(
  fetchImpl: typeof fetch,
  config: WhatsAppServerConfig,
  digits: string,
) {
  const response = await fetchImpl(waapiActionUrl(config.instanceId, "get-number-id"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number: digits }),
  });

  const raw = await response.text();
  let body: GetNumberIdBody | null = null;

  try {
    body = raw ? (JSON.parse(raw) as GetNumberIdBody) : null;
  } catch {
    body = null;
  }

  const serialized = body?.data?.data?.numberId?._serialized;

  if (response.ok && body?.status === "success" && body.data?.status === "success" && typeof serialized === "string" && serialized.includes("@")) {
    return serialized;
  }

  if (!response.ok) {
    console.error("whatsapp chat id lookup failed", sanitizeWhatsAppError(raw, config.token));
  }

  return waapiChatId(digits);
}
