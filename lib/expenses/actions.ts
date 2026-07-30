"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
} from "@/lib/expenses/types";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().uuid().nullable(),
);

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : null),
    z.enum(values).nullable(),
  );

const expenseSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, "Date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description must be 500 characters or fewer."),
  category_id: optionalUuid,
  project_id: optionalUuid,
  vendor_id: optionalUuid,
  budget_amount: z.coerce
    .number({ error: "Budget amount must be a number." })
    .min(0, "Budget amount cannot be negative."),
  paid_amount: z.coerce
    .number({ error: "Paid amount must be a number." })
    .min(0, "Paid amount cannot be negative."),
  payment_method: optionalEnum(EXPENSE_PAYMENT_METHODS),
  priority: optionalEnum(EXPENSE_PRIORITIES),
  status: z.enum(EXPENSE_STATUSES, { error: "Select a valid status." }),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer.")
    .optional()
    .transform((value) => value || null),
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid expense data.";
}

function getMonthYearFromDate(date: string) {
  const [year, month] = date.split("-").map(Number);
  return { year, month };
}

function parseExpenseFormData(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date"),
    description: formData.get("description"),
    category_id: formData.get("category_id") ?? undefined,
    project_id: formData.get("project_id") ?? undefined,
    vendor_id: formData.get("vendor_id") ?? undefined,
    budget_amount: formData.get("budget_amount"),
    paid_amount: formData.get("paid_amount"),
    payment_method: formData.get("payment_method") ?? undefined,
    priority: formData.get("priority") ?? undefined,
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });
}

export async function createExpenseAction(formData: FormData) {
  const parsed = parseExpenseFormData(formData);

  if (!parsed.success) {
    redirect(`/expenses/new?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  if (parsed.data.paid_amount > parsed.data.budget_amount) {
    redirect(
      `/expenses/new?error=${encodeURIComponent("Paid amount cannot exceed budget amount.")}`,
    );
  }

  const { month, year } = getMonthYearFromDate(parsed.data.date);
  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    date: parsed.data.date,
    month,
    year,
    category_id: parsed.data.category_id,
    project_id: parsed.data.project_id,
    vendor_id: parsed.data.vendor_id,
    description: parsed.data.description,
    budget_amount: parsed.data.budget_amount,
    paid_amount: parsed.data.paid_amount,
    payment_method: parsed.data.payment_method,
    priority: parsed.data.priority,
    status: parsed.data.status,
    notes: parsed.data.notes,
  });

  if (error) {
    redirect(`/expenses/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  const parsed = parseExpenseFormData(formData);

  if (!parsed.success) {
    redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  if (parsed.data.paid_amount > parsed.data.budget_amount) {
    redirect(
      `/expenses/${expenseId}/edit?error=${encodeURIComponent("Paid amount cannot exceed budget amount.")}`,
    );
  }

  const { month, year } = getMonthYearFromDate(parsed.data.date);
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      date: parsed.data.date,
      month,
      year,
      category_id: parsed.data.category_id,
      project_id: parsed.data.project_id,
      vendor_id: parsed.data.vendor_id,
      description: parsed.data.description,
      budget_amount: parsed.data.budget_amount,
      paid_amount: parsed.data.paid_amount,
      payment_method: parsed.data.payment_method,
      priority: parsed.data.priority,
      status: parsed.data.status,
      notes: parsed.data.notes,
    })
    .eq("id", expenseId);

  if (error) {
    redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpenseAction(expenseId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/expenses");
  return { success: true };
}
