export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "expenses" | "budget" | "categories" | "projects" | "vendors" | "reports";
  mobileLabel?: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/projects", label: "My Projects", icon: "projects", mobileLabel: "Projects" },
  { href: "/categories", label: "Categories", icon: "categories" },
  { href: "/vendors", label: "Vendors", icon: "vendors" },
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
  { href: "/budgets", label: "Budget", icon: "budget" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

export const mobileNavItems: NavItem[] = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[3],
];
