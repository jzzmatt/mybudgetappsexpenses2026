import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PaymentShareExpense = {
  id: string;
  description: string;
  status: string;
  amount: number;
  currency: string;
  projectName: string;
  categoryName: string;
};

export type PaymentShareView = {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string | null;
  description: string | null;
  expenses: PaymentShareExpense[];
};

function oneName(value: { name?: string } | { name?: string }[] | null | undefined) {
  if (!value) {
    return "";
  }

  const row = Array.isArray(value) ? value[0] : value;
  return row?.name ? String(row.name) : "";
}

export async function getPaymentShareView(userId: string, paymentId: string): Promise<PaymentShareView | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentId)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, user_id, amount, currency, payment_date, payment_method, description")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !payment) {
    return null;
  }

  const { data: lines, error: lineError } = await supabase
    .from("payment_expenses")
    .select("amount, expense:expenses(id, description, status, currency, category:categories(name), project:projects(name))")
    .eq("payment_id", paymentId)
    .eq("user_id", userId);

  if (lineError || !lines) {
    return null;
  }

  const expenses = lines.flatMap((line) => {
    const expense = Array.isArray(line.expense) ? line.expense[0] : line.expense;

    if (!expense) {
      return [];
    }

    return [{
      id: String(expense.id),
      description: String(expense.description ?? ""),
      status: String(expense.status ?? ""),
      amount: Number(line.amount),
      currency: String(expense.currency ?? payment.currency),
      projectName: oneName(expense.project as { name?: string } | { name?: string }[] | null),
      categoryName: oneName(expense.category as { name?: string } | { name?: string }[] | null),
    }];
  });

  return {
    id: String(payment.id),
    amount: Number(payment.amount),
    currency: String(payment.currency),
    paymentDate: String(payment.payment_date),
    paymentMethod: payment.payment_method ? String(payment.payment_method) : null,
    description: payment.description ? String(payment.description) : null,
    expenses,
  };
}
