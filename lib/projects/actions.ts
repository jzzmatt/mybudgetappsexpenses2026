"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  status: z.enum(["active", "paused", "completed"], {
    error: "Select a valid status.",
  }),
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid project data.";
}

export async function createProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    status: formData.get("status"),
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
    status: formData.get("status"),
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
