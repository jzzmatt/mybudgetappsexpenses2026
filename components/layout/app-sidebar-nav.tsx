"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/layout/nav-icon";
import { primaryNavItems } from "@/components/layout/nav-items";

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="app-sidebar-nav">
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
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
