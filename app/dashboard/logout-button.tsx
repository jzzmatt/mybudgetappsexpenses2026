"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const { signOut } = useClerk();

  const logout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return <Button onClick={logout}>Sign out</Button>;
}
