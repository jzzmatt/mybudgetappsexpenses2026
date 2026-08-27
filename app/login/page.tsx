import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getTranslations } from "@/lib/i18n/server";

export default async function LoginPage() {
  const { t } = await getTranslations();

  return (
    <AuthPageShell description={t("auth.signInDescription")} title={t("auth.signInTitle")}>
      <LoginForm />
    </AuthPageShell>
  );
}
