"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function MobileNavSignOut() {
  const router = useRouter();
  const { signOut } = useClerk();

  const logout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button className="app-bottom-nav-signout" onClick={logout} type="button">
      Sign out
    </button>
  );
}
