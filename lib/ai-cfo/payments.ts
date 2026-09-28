import "server-only";

import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { summarizeScopedPayments, type ScopedPaymentLine } from "@/lib/payments/bulk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExpenseRelation = {
  id: string;
  description: string;
  project_id: string | null;
  currency: string;
} | null;

type PaymentRelation = {
  id: string;
  payment_date: string;
  payment_method: string | null;
  description: string | null;
  currency: string;
  amount: number;
} | null;

function one<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listScopedPayments(userId: string, projectIds: string[], startDate?: string, endDate?: string) {
  if (projectIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let paymentsQuery = supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .order("payment_date", { ascending: false })
    .limit(50);

  if (startDate) {
    paymentsQuery = paymentsQuery.gte("payment_date", startDate);
  }

  if (endDate) {
    paymentsQuery = paymentsQuery.lte("payment_date", endDate);
  }

  const { data: payments, error } = await paymentsQuery;

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  const paymentIds = (payments ?? []).map((payment) => String(payment.id));

  if (paymentIds.length === 0) {
    return [];
  }

  return summarizeScopedPayments(await loadPaymentLines(userId, paymentIds), projectIds);
}

export async function getScopedPayment(userId: string, paymentId: string, projectIds: string[]) {
  const summaries = summarizeScopedPayments(await loadPaymentLines(userId, [paymentId]), projectIds);
  return summaries[0] ?? null;
}

async function loadPaymentLines(userId: string, paymentIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_expenses")
    .select("amount, payment_id, expense_id, payment:payments(id, payment_date, payment_method, description, currency, amount), expense:expenses(id, description, project_id, currency)")
    .eq("user_id", userId)
    .in("payment_id", paymentIds);

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return (data ?? []).flatMap((row) => {
    const payment = one(row.payment as PaymentRelation | PaymentRelation[]);
    const expense = one(row.expense as ExpenseRelation | ExpenseRelation[]);

    if (!payment || !expense) {
      return [];
    }

    return [{
      paymentId: String(payment.id),
      paymentDate: String(payment.payment_date),
      paymentMethod: payment.payment_method ? String(payment.payment_method) : null,
      paymentDescription: payment.description ? String(payment.description) : null,
      paymentCurrency: String(payment.currency),
      paymentAmount: Number(payment.amount),
      expenseId: String(expense.id),
      description: String(expense.description ?? ""),
      projectId: expense.project_id ? String(expense.project_id) : null,
      amount: Number(row.amount),
      currency: String(expense.currency ?? payment.currency),
    } satisfies ScopedPaymentLine];
  });
}
