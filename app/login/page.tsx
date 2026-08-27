import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ClerkUnavailableNotice } from "@/components/auth/clerk-unavailable-notice";
import { LoginForm } from "@/components/auth/login-form";
import { isClerkConfigured } from "@/lib/clerk/config";
import { getTranslations } from "@/lib/i18n/server";

export default async function LoginPage() {
  const { t } = await getTranslations();
  const clerkReady = isClerkConfigured();

  return (
    <AuthPageShell description={t("auth.signInDescription")} title={t("auth.signInTitle")}>
      {clerkReady ? <LoginForm /> : <ClerkUnavailableNotice message={t("auth.clerkUnavailable")} />}
    </AuthPageShell>
  );
}
