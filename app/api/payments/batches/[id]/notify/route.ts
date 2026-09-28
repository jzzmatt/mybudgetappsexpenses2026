import { NextResponse } from "next/server";
import { dispatchBatchNotification, readBatchNotificationForm } from "@/lib/payments/batch";
import { ensureUserRecord } from "@/lib/users/ensure-user";

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
    return NextResponse.json({ error: form.error, paymentStatus: "unchanged", notificationStatus: "not_attempted" }, { status: 400 });
  }

  const sent = await dispatchBatchNotification({
    userId,
    paymentId: id,
    phone: form.phone,
    message: form.message,
    idempotencyKey: form.idempotencyKey,
    files: form.files,
  });

  if (!sent.ok) {
    return NextResponse.json({
      error: sent.error,
      paymentStatus: "unchanged",
      notificationStatus: sent.notificationStatus,
    }, { status: sent.notificationStatus === "not_attempted" ? 400 : 502 });
  }

  return NextResponse.json({
    paymentStatus: "unchanged",
    batchStatus: "pending",
    notificationStatus: "sent",
    attachmentCount: "attachmentCount" in sent ? sent.attachmentCount : undefined,
  });
}
