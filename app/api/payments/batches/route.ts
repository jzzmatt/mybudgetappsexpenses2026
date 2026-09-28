import { NextResponse } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { loadPaymentBatchPreview, openPaymentBatch } from "@/lib/payments/batch";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { z } from "zod";

const bodySchema = z.object({
  expenseIds: z.array(z.string()).min(1).max(1000),
  idempotencyKey: z.string(),
});

export async function POST(request: Request) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_selection" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_selection" }, { status: 400 });
  }

  const opened = await openPaymentBatch(userId, parsed.data.expenseIds, parsed.data.idempotencyKey);

  if (!opened.ok) {
    return NextResponse.json({ error: opened.error }, { status: opened.error === "unauthorized" ? 401 : 409 });
  }

  const preview = await loadPaymentBatchPreview(userId, opened.paymentId, await getLocale(), 0);

  if (!preview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(preview);
}
