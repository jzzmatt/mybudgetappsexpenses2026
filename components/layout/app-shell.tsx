import type { ReactNode } from "react";
import { AppShellLayout } from "@/components/layout/app-shell-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { isClerkConfigured } from "@/lib/clerk/config";
import { getTranslations } from "@/lib/i18n/server";

type AppShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export async function AppShell({ title, description, actions, children }: AppShellProps) {
  const { t } = await getTranslations();
  const clerkReady = isClerkConfigured();

  return (
    <AppShellLayout
      actions={actions}
      description={description}
      showMobileSignOut={clerkReady}
      sidebar={<AppSidebar />}
      skipToContentLabel={t("app.skipToContent")}
      title={title}
    >
      {children}
    </AppShellLayout>
  );
}
