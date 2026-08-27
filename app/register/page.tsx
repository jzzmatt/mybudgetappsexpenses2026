import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ClerkUnavailableNotice } from "@/components/auth/clerk-unavailable-notice";
import { RegisterForm } from "@/components/auth/register-form";
import { isClerkConfigured } from "@/lib/clerk/config";
import { getTranslations } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const { t } = await getTranslations();
  const clerkReady = isClerkConfigured();

  return (
    <AuthPageShell description={t("auth.signUpDescription")} title={t("auth.signUpTitle")}>
      {clerkReady ? <RegisterForm /> : <ClerkUnavailableNotice message={t("auth.clerkUnavailable")} />}
    </AuthPageShell>
  );
}
