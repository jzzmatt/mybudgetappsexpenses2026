export type NavItem = {
  href: string;
  labelKey: string;
  icon: "dashboard" | "expenses" | "budget" | "categories" | "projects" | "vendors" | "reports" | "help";
  mobileLabelKey?: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/projects", labelKey: "nav.myProjects", icon: "projects", mobileLabelKey: "nav.projects" },
  { href: "/categories", labelKey: "nav.categories", icon: "categories" },
  { href: "/vendors", labelKey: "nav.vendors", icon: "vendors" },
  { href: "/reports", labelKey: "nav.reports", icon: "reports" },
  { href: "/how-it-works", labelKey: "nav.howItWorks", icon: "help" },
];

export const mobileNavItems: NavItem[] = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  primaryNavItems[3],
];
