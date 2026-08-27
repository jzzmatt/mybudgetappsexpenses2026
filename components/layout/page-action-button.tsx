import Link from "next/link";
import type { ReactNode } from "react";

type PageActionButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function PageActionButton({ href, children, className }: PageActionButtonProps) {
  return (
    <Link
      className={className ? `button button-small page-action-button ${className}` : "button button-small page-action-button"}
      href={href}
    >
      {children}
    </Link>
  );
}
