import Link from "next/link";
import type { ReactNode } from "react";

type PageActionButtonProps = {
  href: string;
  children: ReactNode;
};

export function PageActionButton({ href, children }: PageActionButtonProps) {
  return (
    <Link className="button button-small page-action-button" href={href}>
      {children}
    </Link>
  );
}
