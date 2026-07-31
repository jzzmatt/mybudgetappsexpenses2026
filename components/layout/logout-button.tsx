"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  variant?: "default" | "sidebar";
};

export function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  const logout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  if (variant === "sidebar") {
    return (
      <button
        aria-label="Sign out"
        className="app-sidebar-signout"
        onClick={logout}
        title="Sign out"
        type="button"
      >
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M6.75 15.75H4.5a1.5 1.5 0 0 1-1.5-1.5v-10.5A1.5 1.5 0 0 1 4.5 2.25h2.25M11.25 12.75 15 9l-3.75-3.75M15 9H6.75"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>
    );
  }

  return (
    <Button className="button-outline button-small" onClick={logout} type="button">
      Sign out
    </Button>
  );
}
