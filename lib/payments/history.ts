import "server-only";

import { listPaymentEvidenceMeta } from "@/lib/payments/commit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

export type PaymentBatchListItem = {
  id: string;
  reference: string;
  batchStatus: string;
  amount: number;
  currency: string;
  expenseCount: number;
  paymentDate: string;
  createdAt: string;
  confirmedAt: string | null;
};

export type PaymentNotificationListItem = {
  id: string;
  channel: string;
  status: string;
  recipient: string;
  message: string;
  createdAt: string;
  sentAt: string | null;
  errorMessage: string | null;
  paymentId: string | null;
  reference: string | null;
  amount: number | null;
  currency: string | null;
  expenseCount: number | null;
  attachmentCount: number | null;
};

export type PaymentBatchDetail = PaymentBatchListItem & {
  description: string | null;
  paymentMethod: string | null;
  expenses: {
    id: string;
    description: string;
    amount: number;
    currency: string;
    category: string;
    vendor: string;
    date: string;
    status: string;
    hasEvidence: boolean;
  }[];
  notifications: PaymentNotificationListItem[];
  attachmentCount: number;
  evidenceFiles: { fileName: string; expenseId: string | null }[];
};

export async function listPaymentBatches(): Promise<PaymentBatchListItem[]> {
  await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, reference, batch_status, amount, currency, expense_count, payment_date, created_at, confirmed_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "42703") {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    reference: String(row.reference ?? ""),
    batchStatus: String(row.batch_status ?? "paid"),
    amount: Number(row.amount),
    currency: String(row.currency),
    expenseCount: Number(row.expense_count ?? 0),
    paymentDate: String(row.payment_date),
    createdAt: String(row.created_at),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
  }));
}

export async function getPaymentBatchDetail(paymentId: string): Promise<PaymentBatchDetail | null> {
  const userId = await ensureUserRecord();
  const batch = await readOneBatch(paymentId);

  if (!batch) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("description, payment_method")
    .eq("id", paymentId)
    .maybeSingle();
  const { data: lines } = await supabase
    .from("payment_expenses")
    .select("amount, expense:expenses(id, description, status, date, currency, vendor:vendors(name), category:categories(name))")
    .eq("payment_id", paymentId);
  const evidence = await listPaymentEvidenceMeta(userId, paymentId);
  const notifications = await listPaymentNotifications(paymentId);
  const evidenceIds = new Set(evidence.flatMap((file) => (file.expenseId ? [file.expenseId] : [])));
  const expenses = (lines ?? []).flatMap((line) => {
    const expense = Array.isArray(line.expense) ? line.expense[0] : line.expense;

    if (!expense) {
      return [];
    }

    return [{
      id: String(expense.id),
      description: String(expense.description ?? ""),
      amount: Number(line.amount),
      currency: String(expense.currency ?? batch.currency),
      category: nestedName(expense.category),
      vendor: nestedName(expense.vendor),
      date: String(expense.date ?? ""),
      status: String(expense.status ?? ""),
      hasEvidence: evidenceIds.has(String(expense.id)),
    }];
  });

  return {
    ...batch,
    description: payment?.description ? String(payment.description) : null,
    paymentMethod: payment?.payment_method ? String(payment.payment_method) : null,
    expenses,
    notifications: notifications.filter((item) => item.paymentId === paymentId),
    attachmentCount: evidence.length,
    evidenceFiles: evidence.map((file) => ({ fileName: file.fileName, expenseId: file.expenseId })),
  };
}

export async function listPaymentNotifications(paymentId?: string): Promise<PaymentNotificationListItem[]> {
  await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expense_share_logs")
    .select("id, channel, status, recipient_phone, message, created_at, sent_at, error_message, payment_id, metadata, payment:payments(reference, amount, currency, expense_count)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (paymentId) {
    query = query.eq("payment_id", paymentId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42703") {
      return listPaymentNotificationsWithoutMetadata(paymentId);
    }

    throw new Error(error.message);
  }

  return (data ?? []).map(mapNotification);
}

async function readOneBatch(paymentId: string): Promise<PaymentBatchListItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, reference, batch_status, amount, currency, expense_count, payment_date, created_at, confirmed_at")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    reference: String(data.reference ?? ""),
    batchStatus: String(data.batch_status ?? "paid"),
    amount: Number(data.amount),
    currency: String(data.currency),
    expenseCount: Number(data.expense_count ?? 0),
    paymentDate: String(data.payment_date),
    createdAt: String(data.created_at),
    confirmedAt: data.confirmed_at ? String(data.confirmed_at) : null,
  };
}

async function listPaymentNotificationsWithoutMetadata(paymentId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expense_share_logs")
    .select("id, channel, status, recipient_phone, message, created_at, sent_at, error_message, payment_id, payment:payments(reference, amount, currency)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (paymentId) {
    query = query.eq("payment_id", paymentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapNotification({ ...row, metadata: null, payment: row.payment }));
}

function mapNotification(row: {
  id: string;
  channel: string;
  status: string;
  recipient_phone: string;
  message: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
  payment_id: string | null;
  metadata: { attachmentCount?: number } | null;
  payment: { reference?: string; amount?: number; currency?: string; expense_count?: number } | { reference?: string; amount?: number; currency?: string; expense_count?: number }[] | null;
}) {
  const payment = Array.isArray(row.payment) ? row.payment[0] : row.payment;

  return {
    id: String(row.id),
    channel: String(row.channel),
    status: String(row.status),
    recipient: String(row.recipient_phone),
    message: String(row.message),
    createdAt: String(row.created_at),
    sentAt: row.sent_at ? String(row.sent_at) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    reference: payment?.reference ? String(payment.reference) : null,
    amount: payment?.amount === undefined ? null : Number(payment.amount),
    currency: payment?.currency ? String(payment.currency) : null,
    expenseCount: payment?.expense_count === undefined ? null : Number(payment.expense_count),
    attachmentCount: typeof row.metadata?.attachmentCount === "number" ? row.metadata.attachmentCount : null,
  };
}

function nestedName(value: { name?: string } | { name?: string }[] | null | undefined) {
  if (!value) {
    return "";
  }

  const row = Array.isArray(value) ? value[0] : value;
  return row?.name ? String(row.name) : "";
}
