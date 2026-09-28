import { NextResponse } from "next/server";
import { confirmPaymentBatch, dispatchBatchNotification, readBatchNotificationForm } from "@/lib/payments/batch";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { prepareOutboundWhatsAppMessage } from "@/lib/whatsapp/message";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const form = await readBatchNotificationForm(await request.formData());

  if (!form.ok) {
    return NextResponse.json({
      error: form.error,
      paymentStatus: "unchanged",
      notificationStatus: "not_attempted",
    }, { status: 400 });
  }

  const phone = normalizeWhatsAppNumber(form.phone);
  const outbound = prepareOutboundWhatsAppMessage(form.message);

  if (!phone.ok || !outbound.ok) {
    return NextResponse.json({
      error: !phone.ok ? "invalid_phone" : outbound.error === "too_long" ? "message_too_long" : "message_empty",
      paymentStatus: "unchanged",
      notificationStatus: "not_attempted",
    }, { status: 400 });
  }

  const confirmed = await confirmPaymentBatch({
    userId,
    paymentId: id,
    paidAt: form.paidAt,
    paymentMethod: form.paymentMethod,
    description: form.description,
    files: form.files,
  });

  if (!confirmed.ok) {
    return NextResponse.json({
      error: confirmed.error,
      paymentStatus: "unchanged",
      notificationStatus: "not_attempted",
    }, { status: 409 });
  }

  const sent = await dispatchBatchNotification({
    userId,
    paymentId: id,
    phone: form.phone,
    message: form.message,
    idempotencyKey: form.idempotencyKey,
    files: [],
  });

  if (!sent.ok) {
    return NextResponse.json({
      error: sent.error,
      paymentStatus: "paid",
      batchStatus: "paid",
      notificationStatus: sent.notificationStatus,
    }, { status: 502 });
  }

  return NextResponse.json({
    paymentStatus: "paid",
    batchStatus: "paid",
    notificationStatus: "sent",
  });
}
