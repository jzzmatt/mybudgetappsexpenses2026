import { NextResponse } from "next/server";
import { formatCurrency } from "@/lib/currency/format";
import { isExpenseCurrency } from "@/lib/currency/types";
import { readEvidenceFiles } from "@/lib/payments/commit";
import { canSharePaidExpense, paymentAccess } from "@/lib/payments/rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { getTranslations } from "@/lib/i18n/server";
import { translateEnum } from "@/lib/i18n/translator";
import { deliverPaidExpenseWhatsApp, readWhatsAppServerConfig } from "@/lib/whatsapp/send";
import { formatWhatsAppDate, generatePaidExpenseWhatsAppMessage, shareAmount } from "@/lib/whatsapp/message";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp/phone";
import { publicWhatsAppStatus } from "@/lib/whatsapp/payload";
import { z } from "zod";

const bodySchema = z.object({
  phone: z.string().trim().min(8).max(24),
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
  const { t, locale } = await getTranslations();
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

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, user_id, description, status, paid_at, paid_amount, budget_amount, currency, payment_method, payment_proof_path, payment_proof_filename, project_id, category:categories(name), project:projects(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  if (!data || paymentAccess(String(data.user_id), userId) !== "allowed") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!canSharePaidExpense(String(data.status))) {
    return NextResponse.json({ error: "not_paid" }, { status: 422 });
  }

  const config = readWhatsAppServerConfig();

  if (!config) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const category = oneName(data.category);
  const project = oneName(data.project);
  const currency = isExpenseCurrency(String(data.currency)) ? data.currency : "KZ";
  const amount = shareAmount(Number(data.paid_amount ?? 0), Number(data.budget_amount ?? 0));
  const message = generatePaidExpenseWhatsAppMessage({
    description: String(data.description ?? ""),
    amountLabel: formatCurrency(amount, currency, locale),
    paymentDateLabel: formatWhatsAppDate(String(data.paid_at ?? "")),
    paymentMethodLabel: data.payment_method ? translateEnum(t, "paymentMethod", String(data.payment_method)) : "—",
    categoryName: category,
    projectName: project,
    locale,
  });

  let files: { fileName: string; mimeType: string; bytes: Uint8Array }[] = [];

  try {
    files = await readEvidenceFiles(
      userId,
      id,
      data.payment_proof_path ? String(data.payment_proof_path) : null,
      data.payment_proof_filename ? String(data.payment_proof_filename) : null,
    );
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { data: logRow } = await supabase
    .from("expense_share_logs")
    .insert({
      expense_id: id,
      user_id: userId,
      recipient_phone: phone.display,
      channel: "whatsapp",
      message,
      status: "pending",
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
      })
      .eq("id", logRow.id)
      .eq("user_id", userId);
  }

  if (!sent.ok) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    recipient: phone.display,
    sentAt: new Date().toISOString(),
  });
}

function oneName(value: { name?: string } | { name?: string }[] | null) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0]?.name ?? "" : value.name ?? "";
}
