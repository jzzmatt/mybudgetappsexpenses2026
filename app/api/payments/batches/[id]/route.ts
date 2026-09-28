import { NextResponse } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { cancelPaymentBatch, loadPaymentBatchPreview, removePaymentBatchExpense } from "@/lib/payments/batch";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { z } from "zod";

const removeSchema = z.object({
  expenseId: z.string(),
  extraAttachments: z.number().int().min(0).max(10).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const extra = Number(new URL(request.url).searchParams.get("extra") ?? "0");
  const preview = await loadPaymentBatchPreview(userId, id, await getLocale(), Number.isFinite(extra) ? extra : 0);

  if (!preview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(preview);
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
    return NextResponse.json({ error: "invalid_selection" }, { status: 400 });
  }

  const parsed = removeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_selection" }, { status: 400 });
  }

  const removed = await removePaymentBatchExpense(userId, id, parsed.data.expenseId);

  if (!removed.ok) {
    return NextResponse.json({ error: removed.error }, { status: 409 });
  }

  const preview = await loadPaymentBatchPreview(userId, id, await getLocale(), parsed.data.extraAttachments ?? 0);

  if (!preview) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(preview);
}

export async function DELETE(_request: Request, context: RouteContext) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const cancelled = await cancelPaymentBatch(userId, id);

  if (!cancelled.ok) {
    return NextResponse.json({ error: cancelled.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true, batchStatus: "cancelled" });
}
