"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

function getPublicEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-publishable-key";

  return { url, publishableKey };
}

export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();
  const { url, publishableKey } = getPublicEnvironment();

  return useMemo(
    () =>
      createClient(url, publishableKey, {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }),
    [session, url, publishableKey],
  );
}
