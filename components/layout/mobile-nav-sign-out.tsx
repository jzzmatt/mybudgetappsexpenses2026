"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/client";

export function MobileNavSignOut() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { t } = useTranslations();

  const logout = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button className="app-bottom-nav-signout" onClick={logout} type="button">
      {t("auth.signOut")}
    </button>
  );
}
