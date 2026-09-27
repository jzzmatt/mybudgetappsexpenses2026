"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTranslations } from "@/lib/i18n/server";
import { fileFromForm, revalidateExpensePaths, storePaymentEvidence } from "@/lib/payments/commit";
import { isPaymentDate, normalizePaymentNote, resolveExpenseStatus, shouldConfirmPayment } from "@/lib/payments/rules";
import { removePaymentEvidenceFile } from "@/lib/payments/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { getExpenseById } from "@/lib/expenses/queries";
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PRIORITIES,
  EXPENSE_STATUSES,
} from "@/lib/expenses/types";
import { EXPENSE_CURRENCIES } from "@/lib/currency/types";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().uuid().nullable(),
);

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : null),
    z.enum(values).nullable(),
  );

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().nullable().optional(),
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
  currency: z.enum(EXPENSE_CURRENCIES, { error: "Select a valid currency." }),
  payment_method: optionalEnum(EXPENSE_PAYMENT_METHODS),
  payment_reference: optionalString,
  payment_proof_path: optionalString,
  payment_proof_filename: optionalString,
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
    currency: formData.get("currency"),
    payment_method: formData.get("payment_method") ?? undefined,
    payment_reference: formData.get("payment_reference") ?? undefined,
    payment_proof_path: formData.get("payment_proof_path") ?? undefined,
    payment_proof_filename: formData.get("payment_proof_filename") ?? undefined,
    priority: formData.get("priority") ?? undefined,
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });
}

export async function createExpenseAction(formData: FormData) {
  const parsed = parseExpenseFormData(formData);

  if (!parsed.success) {
    const projectId = formData.get("project_id");
    const redirectUrl = projectId
      ? `/projects/${projectId}/expenses?error=${encodeURIComponent(formatZodError(parsed.error))}`
      : `/expenses/new?error=${encodeURIComponent(formatZodError(parsed.error))}`;
    redirect(redirectUrl);
  }

  const { month, year } = getMonthYearFromDate(parsed.data.date);
  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();

  // If project_id is provided, inherit the project's currency
  let expenseCurrency = parsed.data.currency;
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("currency")
      .eq("id", parsed.data.project_id)
      .maybeSingle();

    if (project?.currency) {
      expenseCurrency = project.currency;
    }
  }

  let { error } = await supabase.from("expenses").insert({
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
    currency: expenseCurrency,
    payment_method: parsed.data.payment_method,
    payment_reference: parsed.data.payment_reference,
    payment_proof_path: parsed.data.payment_proof_path,
    payment_proof_filename: parsed.data.payment_proof_filename,
    priority: parsed.data.priority,
    status: parsed.data.status,
    notes: parsed.data.notes,
  });

  // If payment proof columns don't exist yet before migration, gracefully fallback
  if (error && (error.code === "42703" || error.message?.includes("does not exist"))) {
    const fallback = await supabase.from("expenses").insert({
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
      currency: expenseCurrency,
      payment_method: parsed.data.payment_method,
      priority: parsed.data.priority,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });
    error = fallback.error;
  }

  if (error) {
    const projectId = parsed.data.project_id;
    const redirectUrl = projectId
      ? `/projects/${projectId}/expenses?error=${encodeURIComponent(error.message)}`
      : `/expenses/new?error=${encodeURIComponent(error.message)}`;
    redirect(redirectUrl);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  if (parsed.data.project_id) {
    revalidatePath(`/projects/${parsed.data.project_id}`);
    revalidatePath(`/projects/${parsed.data.project_id}/expenses`);
    redirect(`/projects/${parsed.data.project_id}/expenses`);
  }
  redirect("/expenses");
}

export async function updateExpenseAction(expenseId: string, formData: FormData) {
  const parsed = parseExpenseFormData(formData);

  if (!parsed.success) {
    redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  const { month, year } = getMonthYearFromDate(parsed.data.date);
  const userId = await ensureUserRecord();
  const existing = await getExpenseById(expenseId);

  if (!existing) {
    redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent("Expense not found.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const becomingPaid = shouldConfirmPayment(existing.status, parsed.data.status);
  let paidAt: string | null = null;
  let paymentNote: string | null = null;
  let uploadedPaths: string[] = [];

  if (becomingPaid) {
    const { t } = await getTranslations();

    if (formData.get("payment_confirmed") !== "1") {
      redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(t("payments.confirmRequired"))}`);
    }

    paidAt = String(formData.get("confirm_paid_at") ?? "");
    paymentNote = normalizePaymentNote(String(formData.get("confirm_payment_note") ?? ""));

    if (!isPaymentDate(paidAt)) {
      redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(t("payments.fileInvalid"))}`);
    }

    const prepared = await prepareEvidenceFiles(formData);

    if ("error" in prepared) {
      redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(t("payments.fileInvalid"))}`);
    }

    try {
      uploadedPaths = await storePaymentEvidence({
        userId,
        expenseId,
        projectId: existing.project_id || parsed.data.project_id || "",
        files: prepared.files,
      });
    } catch {
      redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(t("payments.uploadFailed"))}`);
    }
  } else if (formData.has("paid_at")) {
    const candidate = String(formData.get("paid_at") ?? "");
    paidAt = candidate && isPaymentDate(candidate) ? candidate : null;
    paymentNote = normalizePaymentNote(String(formData.get("payment_note") ?? ""));
  }

  // If project_id is provided, inherit the project's currency
  let expenseCurrency = parsed.data.currency;
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("currency")
      .eq("id", parsed.data.project_id)
      .maybeSingle();

    if (project?.currency) {
      expenseCurrency = project.currency;
    }
  }

  let { error } = await supabase
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
      currency: expenseCurrency,
      payment_method: parsed.data.payment_method,
      payment_reference: parsed.data.payment_reference,
      payment_proof_path: parsed.data.payment_proof_path,
      payment_proof_filename: parsed.data.payment_proof_filename,
      priority: parsed.data.priority,
      status: resolveExpenseStatus(existing.status, becomingPaid),
      notes: parsed.data.notes,
      ...(paidAt ? { paid_at: paidAt } : {}),
      ...(paymentNote !== null && (becomingPaid || formData.has("payment_note")) ? { payment_note: paymentNote } : {}),
    })
    .eq("id", expenseId)
    .eq("user_id", userId);

  if (!becomingPaid && error && (error.code === "42703" || error.message?.includes("does not exist"))) {
    const fallback = await supabase
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
        currency: expenseCurrency,
        payment_method: parsed.data.payment_method,
        priority: parsed.data.priority,
        status: existing.status,
        notes: parsed.data.notes,
      })
      .eq("id", expenseId);
    error = fallback.error;
  }

  if (error) {
    if (uploadedPaths.length > 0) {
      await rollbackEvidence(userId, uploadedPaths);
    }

    redirect(`/expenses/${expenseId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidateExpensePaths(parsed.data.project_id);
  const paidQuery = becomingPaid ? "?paid=1" : "";

  if (parsed.data.project_id) {
    redirect(`/projects/${parsed.data.project_id}/expenses${paidQuery}`);
  }

  redirect(`/expenses${paidQuery}`);
}

async function prepareEvidenceFiles(formData: FormData) {
  const receipt = await fileFromForm(formData.get("receipt"), "receipt");
  const picture = await fileFromForm(formData.get("picture"), "image");

  if (receipt && "error" in receipt) {
    return { error: receipt.error };
  }

  if (picture && "error" in picture) {
    return { error: picture.error };
  }

  return {
    files: [receipt, picture].filter((file): file is NonNullable<typeof receipt> & { filename: string } => Boolean(file && "filename" in file)),
  };
}

async function rollbackEvidence(userId: string, paths: string[]) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("expense_payment_evidence").delete().eq("user_id", userId).in("storage_path", paths);
  await Promise.all(paths.map((path) => removePaymentEvidenceFile(path).catch(() => undefined)));
}

function withCopySuffix(description: string) {
  const suffix = " (Copy)";

  if (description.endsWith(suffix)) {
    return description;
  }

  return `${description}${suffix}`;
}

export async function duplicateExpenseAction(expenseId: string) {
  const expense = await getExpenseById(expenseId);

  if (!expense) {
    return { error: "Expense not found." };
  }

  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    date: expense.date,
    month: expense.month,
    year: expense.year,
    category_id: expense.category_id,
    project_id: expense.project_id,
    vendor_id: expense.vendor_id,
    description: withCopySuffix(expense.description),
    budget_amount: expense.budget_amount,
    paid_amount: expense.paid_amount,
    currency: expense.currency,
    payment_method: expense.payment_method,
    priority: expense.priority,
    status: expense.status,
    notes: expense.notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpenseAction(expenseId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";

  if (path.startsWith("/expenses") || path.startsWith("/projects/")) {
    return path.split("?")[0] || "/expenses";
  }

  return "/expenses";
}

export async function markExpensePaidAction(expenseId: string, formData: FormData) {
  const { t } = await getTranslations();
  const returnPath = safeReturnPath(formData.get("return_to"));
  const userId = await ensureUserRecord();
  const existing = await getExpenseById(expenseId);

  if (!existing || existing.user_id !== userId || !shouldConfirmPayment(existing.status, "paid")) {
    redirect(`${returnPath}?error=${encodeURIComponent(t("payments.confirmRequired"))}`);
  }

  const paidAt = String(formData.get("paid_at") ?? "");
  const paymentNote = normalizePaymentNote(String(formData.get("payment_note") ?? ""));
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || existing.payment_method;

  if (!isPaymentDate(paidAt)) {
    redirect(`${returnPath}?error=${encodeURIComponent(t("payments.fileInvalid"))}`);
  }

  const prepared = await prepareEvidenceFiles(formData);

  if ("error" in prepared) {
    redirect(`${returnPath}?error=${encodeURIComponent(t("payments.fileInvalid"))}`);
  }

  let uploadedPaths: string[] = [];

  try {
    uploadedPaths = await storePaymentEvidence({
      userId,
      expenseId,
      projectId: existing.project_id || "",
      files: prepared.files,
    });
  } catch {
    redirect(`${returnPath}?error=${encodeURIComponent(t("payments.uploadFailed"))}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      status: "paid",
      paid_at: paidAt,
      payment_note: paymentNote,
      payment_method: paymentMethod,
    })
    .eq("id", expenseId)
    .eq("user_id", userId);

  if (error) {
    await rollbackEvidence(userId, uploadedPaths);
    redirect(`${returnPath}?error=${encodeURIComponent(t("payments.uploadFailed"))}`);
  }

  revalidateExpensePaths(existing.project_id);
  redirect(`${returnPath}?paid=1`);
}

export async function removePaymentEvidenceAction(evidenceId: string) {
  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("expense_payment_evidence")
    .select("id, expense_id, storage_path")
    .eq("id", evidenceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    redirect("/expenses");
  }

  await removePaymentEvidenceFile(String(data.storage_path));
  await supabase.from("expense_payment_evidence").delete().eq("id", evidenceId).eq("user_id", userId);
  revalidateExpensePaths(null);
  redirect(`/expenses/${data.expense_id}/edit`);
}
