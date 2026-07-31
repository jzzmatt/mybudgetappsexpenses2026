"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .transform((value) => value || null),
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid category data.";
}

export async function createCategoryAction(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect(`/categories/new?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  if (error) {
    const message =
      error.code === "23505"
        ? "A category with this name already exists."
        : error.message;
    redirect(`/categories/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    redirect(
      `/categories/${categoryId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`,
    );
  }

  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .eq("id", categoryId);

  if (error) {
    const message =
      error.code === "23505"
        ? "A category with this name already exists."
        : error.message;
    redirect(`/categories/${categoryId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategoryAction(categoryId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}
