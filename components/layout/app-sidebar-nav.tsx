"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/layout/nav-icon";
import { primaryNavItems } from "@/components/layout/nav-items";
import { useTranslations } from "@/lib/i18n/client";

export function AppSidebarNav() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav aria-label={t("nav.main")} className="app-sidebar-nav">
      {primaryNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`app-sidebar-link${isActive ? " app-sidebar-link-active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <NavIcon name={item.icon} />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
