import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { listPaymentEvidenceMeta, readPaymentEvidenceFiles } from "@/lib/payments/commit";
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
  receiptsOnly: z.boolean().optional(),
});

export const maxDuration = 60;

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

  const receiptsOnly = parsed.data.receiptsOnly === true;
  let expectedEvidence: Awaited<ReturnType<typeof listPaymentEvidenceMeta>> = [];
  let files: { fileName: string; mimeType: string; bytes: Uint8Array }[] = [];

  try {
    expectedEvidence = await listPaymentEvidenceMeta(userId, id);
    files = await readPaymentEvidenceFiles(userId, id);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: receiptsOnly ? "not_found" : "unavailable" }, { status: receiptsOnly ? 404 : 503 });
  }

  if (expectedEvidence.length > 0 && files.length !== expectedEvidence.length) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  let message: string;

  if (receiptsOnly) {
    message = `[receipts-only] ${files.map((file) => file.fileName).join(", ")}`;
  } else {
    const outbound = prepareOutboundWhatsAppMessage(parsed.data.message);

    if (!outbound.ok) {
      return NextResponse.json({ error: outbound.error === "too_long" ? "message_too_long" : "message_empty" }, { status: 400 });
    }

    message = outbound.message;
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
    receiptsOnly,
  });

  const receiptsMissing = sent.ok
    && expectedEvidence.length > 0
    && sent.attachmentsSent !== expectedEvidence.length;
  const receiptFailure = !sent.ok && "textSent" in sent && sent.textSent;

  if (logRow?.id) {
    await supabase
      .from("expense_share_logs")
      .update({
        status: sent.ok && !receiptsMissing ? "sent" : "failed",
        sent_at: sent.ok && !receiptsMissing ? new Date().toISOString() : null,
        error_message: !sent.ok ? sent.error : receiptsMissing ? "receipt_send_failed" : null,
        waapi_message_id: sent.ok && !receiptsMissing ? sent.messageId : "messageId" in sent ? sent.messageId : null,
        waapi_reference_id: sent.ok && !receiptsMissing ? sent.referenceId : "referenceId" in sent ? sent.referenceId : null,
      })
      .eq("id", logRow.id)
      .eq("user_id", userId);
  }

  if (receiptFailure) {
    return NextResponse.json({ error: "receipt_send_failed", textSent: true }, { status: 502 });
  }

  if (!sent.ok || receiptsMissing) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  revalidatePath(`/payments/${id}`);
  revalidatePath("/payments");
  revalidatePath("/notifications");

  return NextResponse.json({
    ok: true,
    recipient: phone.display,
    sentAt: new Date().toISOString(),
    attachmentCount: files.length,
    attachmentsSent: sent.attachmentsSent,
  });
}
