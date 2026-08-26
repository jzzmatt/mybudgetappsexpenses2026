"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { projectSchema } from "@/lib/projects/schema";

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid project data.";
}

export async function createProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    budget_amount: formData.get("budget_amount") ?? "0",
    currency: formData.get("currency") ?? "KZ",
    status: formData.get("status") ?? "active",
  });

  if (!parsed.success) {
    redirect(`/projects/new?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("projects").insert({
    user_id: userId,
    name: parsed.data.name,
    description: parsed.data.description,
    budget_amount: parsed.data.budget_amount,
    currency: parsed.data.currency,
    status: parsed.data.status,
  });

  if (error) {
    const message =
      error.code === "23505" ? "A project with this name already exists." : error.message;
    redirect(`/projects/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    budget_amount: formData.get("budget_amount") ?? "0",
    currency: formData.get("currency") ?? "KZ",
    status: formData.get("status") ?? "active",
  });

  if (!parsed.success) {
    redirect(`/projects/${projectId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      budget_amount: parsed.data.budget_amount,
      currency: parsed.data.currency,
      status: parsed.data.status,
    })
    .eq("id", projectId);

  if (error) {
    const message =
      error.code === "23505" ? "A project with this name already exists." : error.message;
    redirect(`/projects/${projectId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function deleteProjectAction(projectId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return { success: true };
}
