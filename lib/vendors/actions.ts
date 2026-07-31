"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

const vendorSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or fewer."),
  contact_info: z
    .string()
    .trim()
    .max(200, "Contact info must be 200 characters or fewer.")
    .optional()
    .transform((value) => value || null),
});

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid vendor data.";
}

export async function createVendorAction(formData: FormData) {
  const parsed = vendorSchema.safeParse({
    name: formData.get("name"),
    contact_info: formData.get("contact_info") ?? undefined,
  });

  if (!parsed.success) {
    redirect(`/vendors/new?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  const userId = await ensureUserRecord();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vendors").insert({
    user_id: userId,
    name: parsed.data.name,
    contact_info: parsed.data.contact_info,
  });

  if (error) {
    const message =
      error.code === "23505" ? "A vendor with this name already exists." : error.message;
    redirect(`/vendors/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function updateVendorAction(vendorId: string, formData: FormData) {
  const parsed = vendorSchema.safeParse({
    name: formData.get("name"),
    contact_info: formData.get("contact_info") ?? undefined,
  });

  if (!parsed.success) {
    redirect(`/vendors/${vendorId}/edit?error=${encodeURIComponent(formatZodError(parsed.error))}`);
  }

  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: parsed.data.name,
      contact_info: parsed.data.contact_info,
    })
    .eq("id", vendorId);

  if (error) {
    const message =
      error.code === "23505" ? "A vendor with this name already exists." : error.message;
    redirect(`/vendors/${vendorId}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function deleteVendorAction(vendorId: string) {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/vendors");
  return { success: true };
}
