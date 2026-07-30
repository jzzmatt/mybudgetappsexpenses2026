import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getPublicEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}

/**
 * Creates a browser-safe Supabase client. Authentication/session handling is
 * intentionally introduced in Phase 02.
 */
export function createSupabaseClient(): SupabaseClient {
  const { url, publishableKey } = getPublicEnvironment();

  return createClient(url, publishableKey);
}
