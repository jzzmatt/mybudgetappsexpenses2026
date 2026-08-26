import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type { Vendor } from "@/lib/vendors/types";

export async function getVendors(search?: string): Promise<Vendor[]> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getVendors:", error);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("vendors")
    .select("id, user_id, name, contact_info, created_at, updated_at")
    .order("name", { ascending: true });

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    query = query.or(`name.ilike.%${trimmedSearch}%,contact_info.ilike.%${trimmedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  try {
    await ensureUserRecord();
  } catch (error) {
    console.error("ensureUserRecord failed in getVendorById:", error);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, user_id, name, contact_info, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
