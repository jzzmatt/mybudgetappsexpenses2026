import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type { Category } from "@/lib/categories/types";

export async function getCategories(search?: string): Promise<Category[]> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getCategories:", error);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("categories")
    .select("id, user_id, name, description, created_at, updated_at")
    .order("name", { ascending: true });

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    query = query.or(`name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getCategoryById:", error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, user_id, name, description, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
