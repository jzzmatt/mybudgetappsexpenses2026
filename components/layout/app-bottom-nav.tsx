"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems, primaryNavItems } from "@/components/layout/nav-items";
import { NavIcon } from "@/components/layout/nav-icon";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav() {
  const pathname = usePathname();
  const moreActive = primaryNavItems
    .slice(3)
    .some((item) => isActivePath(pathname, item.href));

  return (
    <nav aria-label="Mobile navigation" className="app-bottom-nav">
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
            <span>{item.mobileLabel ?? item.label}</span>
          </Link>
        );
      })}
      <details className="app-bottom-nav-more">
        <summary
          aria-current={moreActive ? "page" : undefined}
          className={`app-bottom-nav-link app-bottom-nav-more-trigger${moreActive ? " app-bottom-nav-link-active" : ""}`}
        >
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
            <path
              d="M3.75 9h10.5M3.75 4.5h10.5M3.75 13.5h10.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
          <span>More</span>
        </summary>
        <div className="app-bottom-nav-menu">
          {primaryNavItems.slice(3).map((item) => (
            <Link
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
