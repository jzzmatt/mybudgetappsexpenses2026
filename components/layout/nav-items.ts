export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "expenses" | "budget" | "categories" | "projects" | "vendors" | "reports";
  mobileLabel?: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", mobileLabel: "Home" },
  { href: "/expenses", label: "Expenses", icon: "expenses" },
  { href: "/budgets", label: "Budget", icon: "budget" },
  { href: "/categories", label: "Categories", icon: "categories" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/vendors", label: "Vendors", icon: "vendors" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

export const mobileNavItems: NavItem[] = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[6],
];
