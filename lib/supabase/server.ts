import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function getPublicEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-publishable-key";

  return { url, publishableKey };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = getPublicEnvironment();

  return createClient(url, publishableKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
