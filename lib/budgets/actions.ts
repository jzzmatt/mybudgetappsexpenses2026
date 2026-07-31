"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().uuid().nullable(),
);

const optionalMonth = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}, z.number().int().min(1).max(12).nullable());

const budgetSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  amount: z.coerce
    .number({ error: "Amount must be a number." })
    .min(0, "Amount cannot be negative."),
  currency: z.enum(EXPENSE_CURRENCIES, { error: "Select a valid currency." }),
  year: z.coerce
    .number({ error: "Year must be a number." })
    .int()
    .min(2000, "Year must be 2000 or later.")
    .max(2100, "Year must be 2100 or earlier."),
  month: optionalMonth,
  category_id: optionalUuid,
  project_id: optionalUuid,
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid budget data.";
}

function parseBudgetFormData(formData: FormData) {
  return budgetSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    year: formData.get("year"),
    month: formData.get("month") ?? undefined,
    category_id: formData.get("category_id") ?? undefined,
    project_id: formData.get("project_id") ?? undefined,
  });
}

export async function createBudgetAction(formData: FormData) {
  const parsed = parseBudgetFormData(formData);

  if (!parsed.success) {
    redirect(`/budgets/new?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budgets").insert({
    user_id: userId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    year: parsed.data.year,
    month: parsed.data.month,
    category_id: parsed.data.category_id,
    project_id: parsed.data.project_id,
  });

  if (error) {
    redirect(`/budgets/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/budgets");
  redirect("/budgets");
}

export async function updateBudgetAction(budgetId: string, formData: FormData) {
  const parsed = parseBudgetFormData(formData);

  if (!parsed.success) {
    redirect(`/budgets/${budgetId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("budgets")
    .update({
      name: parsed.data.name,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      year: parsed.data.year,
      month: parsed.data.month,
      category_id: parsed.data.category_id,
      project_id: parsed.data.project_id,
    })
    .eq("id", budgetId);

  if (error) {
    redirect(`/budgets/${budgetId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/budgets");
  redirect("/budgets");
}

export async function deleteBudgetAction(budgetId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/budgets");
  return { success: true };
}
