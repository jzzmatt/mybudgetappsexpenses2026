import "server-only";

import {
  canAddFavorite,
  findDuplicateFavorite,
  getFavoriteLimit,
  sortFavorites,
  type FavoriteQuestion,
} from "@/lib/ai-cfo/favorites";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FavoriteRow = {
  id: string;
  user_id: string;
  title: string;
  question: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  usage_count: number;
};

function toFavorite(row: FavoriteRow): FavoriteQuestion {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    question: row.question,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    usageCount: Number(row.usage_count ?? 0),
  };
}

export async function listFavorites(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_cfo_favorite_questions")
    .select("id, user_id, title, question, created_at, updated_at, last_used_at, usage_count")
    .eq("user_id", userId);

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return sortFavorites((data ?? []).map((row) => toFavorite(row as FavoriteRow)));
}

export async function getFavoriteForUser(userId: string, favoriteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_cfo_favorite_questions")
    .select("id, user_id, title, question, created_at, updated_at, last_used_at, usage_count")
    .eq("user_id", userId)
    .eq("id", favoriteId)
    .maybeSingle();

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return data ? toFavorite(data as FavoriteRow) : null;
}

export async function createFavorite(userId: string, input: { title: string; question: string }) {
  const existing = await listFavorites(userId);

  if (findDuplicateFavorite(existing, input.question)) {
    return { error: "duplicate" as const };
  }

  if (!canAddFavorite(existing.length, getFavoriteLimit())) {
    return { error: "limit_reached" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_cfo_favorite_questions")
    .insert({
      user_id: userId,
      title: input.title,
      question: input.question,
      usage_count: 0,
    })
    .select("id, user_id, title, question, created_at, updated_at, last_used_at, usage_count")
    .single();

  if (error || !data) {
    throw new AiCfoDatabaseError(error?.message ?? "Unable to save favorite.");
  }

  return { favorite: toFavorite(data as FavoriteRow) };
}

export async function updateFavorite(userId: string, favoriteId: string, input: { title: string; question: string }) {
  const existing = await listFavorites(userId);
  const current = existing.find((favorite) => favorite.id === favoriteId);

  if (!current) {
    return { error: "not_found" as const };
  }

  if (findDuplicateFavorite(existing, input.question, favoriteId)) {
    return { error: "duplicate" as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_cfo_favorite_questions")
    .update({
      title: input.title,
      question: input.question,
    })
    .eq("user_id", userId)
    .eq("id", favoriteId)
    .select("id, user_id, title, question, created_at, updated_at, last_used_at, usage_count")
    .maybeSingle();

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  if (!data) {
    return { error: "not_found" as const };
  }

  return { favorite: toFavorite(data as FavoriteRow) };
}

export async function deleteFavorite(userId: string, favoriteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_cfo_favorite_questions")
    .delete()
    .eq("user_id", userId)
    .eq("id", favoriteId)
    .select("id");

  if (error) {
    throw new AiCfoDatabaseError(error.message);
  }

  return Boolean(data && data.length > 0);
}

export async function markFavoriteUsed(userId: string, favoriteId: string) {
  const current = await getFavoriteForUser(userId, favoriteId);

  if (!current) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("ai_cfo_favorite_questions")
    .update({
      usage_count: current.usageCount + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", favoriteId);
}
