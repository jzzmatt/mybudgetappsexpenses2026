"use client";

import { useSidebarVisibility } from "@/components/layout/sidebar-visibility";
import { useTranslations } from "@/lib/i18n/client";

type AppSidebarToggleProps = {
  variant: "collapse" | "expand";
};

export function AppSidebarToggle({ variant }: AppSidebarToggleProps) {
  const { hidden, toggle } = useSidebarVisibility();
  const { t } = useTranslations();

  if (variant === "collapse" && hidden) {
    return null;
  }

  if (variant === "expand" && !hidden) {
    return null;
  }

  const label = variant === "collapse" ? t("app.hideSidebar") : t("app.showSidebar");

  return (
    <button
      aria-controls="app-sidebar"
      aria-expanded={variant === "collapse"}
      className={`app-sidebar-toggle app-sidebar-toggle-${variant}`}
      onClick={toggle}
      type="button"
    >
      <span className="app-sidebar-toggle-icon" aria-hidden="true">
        {variant === "collapse" ? (
          <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
            <path
              d="M11.25 4.5 6.75 9l4.5 4.5M3.75 4.5v9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ) : (
          <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
            <path
              d="M6.75 4.5 11.25 9l-4.5 4.5M14.25 4.5v9M3.75 3.75h4.5v10.5H3.75V3.75Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </span>
      <span className="app-sidebar-toggle-label">{label}</span>
    </button>
  );
}
