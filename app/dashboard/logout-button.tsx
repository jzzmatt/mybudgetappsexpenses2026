"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await createSupabaseClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return <Button onClick={logout}>Sign out</Button>;
}
