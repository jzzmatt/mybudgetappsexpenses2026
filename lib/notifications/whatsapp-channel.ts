import "server-only";

import { deliverPaidExpenseWhatsApp, readWhatsAppServerConfig } from "@/lib/whatsapp/send";

export type NotificationFile = {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
};

export async function sendWhatsAppNotification(input: {
  to: string;
  message: string;
  files: NotificationFile[];
}) {
  const config = readWhatsAppServerConfig();

  if (!config) {
    return { ok: false as const, error: "not_configured" as const };
  }

  const result = await deliverPaidExpenseWhatsApp({
    to: input.to,
    body: input.message,
    files: input.files,
    config,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return {
    ok: true as const,
    messageId: result.messageId,
    referenceId: result.referenceId,
    attachmentsSent: result.attachmentsSent,
  };
}
