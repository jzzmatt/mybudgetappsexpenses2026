import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import type { Project } from "@/lib/projects/types";

export async function getProjects(search?: string): Promise<Project[]> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("id, user_id, name, description, status, created_at, updated_at")
    .order("name", { ascending: true });

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    query = query.or(
      `name.ilike.%${trimmedSearch}%,description.ilike.%${trimmedSearch}%,status.ilike.%${trimmedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProjectById(id: string): Promise<Project | null> {
  await ensureUserRecord();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id, name, description, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
