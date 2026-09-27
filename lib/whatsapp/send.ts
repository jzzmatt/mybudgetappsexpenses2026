import "server-only";

import { deliverPaidExpenseWhatsApp } from "@/lib/whatsapp/gateway";
import { isWhatsAppConfigured } from "@/lib/whatsapp/payload";

export { deliverPaidExpenseWhatsApp };

export function readWhatsAppServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const source = env as { WAAPI_API_TOKEN?: string; WAAPI_INSTANCE_ID?: string };

  if (!isWhatsAppConfigured(source)) {
    return null;
  }

  return {
    token: source.WAAPI_API_TOKEN!.trim(),
    instanceId: source.WAAPI_INSTANCE_ID!.trim(),
  };
}
