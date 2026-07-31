import type { NavItem } from "@/components/layout/nav-items";

type NavIconProps = {
  name: NavItem["icon"];
};

export function NavIcon({ name }: NavIconProps) {
  switch (name) {
    case "dashboard":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M2.25 7.125 9 2.25l6.75 4.875V15a1.125 1.125 0 0 1-1.125 1.125H3.375A1.125 1.125 0 0 1 2.25 15V7.125Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M7.125 16.125V9h3.75v7.125" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "expenses":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.375 4.125h11.25M3.375 9h11.25M3.375 13.875h7.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "budget":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M4.5 3.75h9a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M6 7.5h6M6 10.5h3.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case "categories":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.75 5.25h3.75V9H3.75V5.25ZM10.5 5.25h3.75V9H10.5V5.25ZM3.75 10.5h3.75v3.75H3.75V10.5ZM10.5 10.5h3.75v3.75H10.5V10.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "projects":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.75 5.25 9 2.25l5.25 3v7.5L9 15.75 3.75 12.75V5.25Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "vendors":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.75 6.75 9 3.375 14.25 6.75V13.5a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V6.75Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M6.75 14.25V9.75h4.5v4.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "reports":
      return (
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M4.5 13.5V8.25M9 13.5V4.5M13.5 13.5v-4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
  }
}
