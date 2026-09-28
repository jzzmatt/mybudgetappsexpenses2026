import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { readPaymentEvidenceFiles } from "@/lib/payments/commit";
import { getPaymentShareView } from "@/lib/payments/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { deliverPaidExpenseWhatsApp, readWhatsAppServerConfig } from "@/lib/whatsapp/send";
import { prepareOutboundWhatsAppMessage } from "@/lib/whatsapp/message";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";
import { publicWhatsAppStatus } from "@/lib/whatsapp/payload";
import { z } from "zod";

const bodySchema = z.object({
  phone: z.string().trim().min(8).max(24),
  message: z.string(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET() {
  return NextResponse.json(publicWhatsAppStatus(Boolean(readWhatsAppServerConfig())));
}

export async function POST(request: Request, context: RouteContext) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const phone = normalizeWhatsAppNumber(parsed.data.phone);

  if (!phone.ok) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const payment = await getPaymentShareView(userId, id);

  if (!payment || payment.expenses.length === 0 || payment.expenses.some((expense) => expense.status !== "paid")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const config = readWhatsAppServerConfig();

  if (!config) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const outbound = prepareOutboundWhatsAppMessage(parsed.data.message);

  if (!outbound.ok) {
    return NextResponse.json({ error: outbound.error === "too_long" ? "message_too_long" : "message_empty" }, { status: 400 });
  }

  const message = outbound.message;
  let files: { fileName: string; mimeType: string; bytes: Uint8Array }[] = [];

  try {
    files = await readPaymentEvidenceFiles(userId, id);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: logRow } = await supabase
    .from("expense_share_logs")
    .insert({
      payment_id: id,
      user_id: userId,
      recipient_phone: phone.display,
      channel: "whatsapp",
      message,
      status: "pending",
      metadata: { attachmentCount: files.length },
    })
    .select("id")
    .maybeSingle();

  const sent = await deliverPaidExpenseWhatsApp({
    to: phone.e164,
    body: message,
    files,
    config,
  });

  if (logRow?.id) {
    await supabase
      .from("expense_share_logs")
      .update({
        status: sent.ok ? "sent" : "failed",
        sent_at: sent.ok ? new Date().toISOString() : null,
        error_message: sent.ok ? null : sent.error,
        waapi_message_id: sent.ok ? sent.messageId : null,
        waapi_reference_id: sent.ok ? sent.referenceId : null,
      })
      .eq("id", logRow.id)
      .eq("user_id", userId);
  }

  if (!sent.ok) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  revalidatePath(`/payments/${id}`);
  revalidatePath("/payments");
  revalidatePath("/notifications");

  return NextResponse.json({
    ok: true,
    recipient: phone.display,
    sentAt: new Date().toISOString(),
  });
}
