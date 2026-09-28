"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNavSignOut } from "@/components/layout/mobile-nav-sign-out";
import { mobileNavItems, mobileOverflowNavItems } from "@/components/layout/nav-items";
import { NavIcon } from "@/components/layout/nav-icon";
import { useTranslations } from "@/lib/i18n/client";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const overflowActive = mobileOverflowNavItems.some((item) => isActivePath(pathname, item.href));

  return (
    <nav aria-label={t("nav.mobile")} className="app-bottom-nav">
      {mobileNavItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`app-bottom-nav-link${isActive ? " app-bottom-nav-link-active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <NavIcon name={item.icon} />
            <span>{t(item.mobileLabelKey ?? item.labelKey)}</span>
          </Link>
        );
      })}
      <details className="app-bottom-nav-more">
        <summary
          aria-current={overflowActive ? "page" : undefined}
          className={`app-bottom-nav-link app-bottom-nav-more-trigger${overflowActive ? " app-bottom-nav-link-active" : ""}`}
        >
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
            <path
              d="M3.75 9h10.5M3.75 4.5h10.5M3.75 13.5h10.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
          <span>{t("nav.more")}</span>
        </summary>
        <div className="app-bottom-nav-menu">
          {mobileOverflowNavItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "app-bottom-nav-menu-link-active" : undefined}
                href={item.href}
                key={item.href}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
          <MobileNavSignOut />
        </div>
      </details>
    </nav>
  );
}
