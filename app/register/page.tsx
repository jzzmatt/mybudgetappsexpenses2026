import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getTranslations } from "@/lib/i18n/server";

export default async function RegisterPage() {
  const { t } = await getTranslations();

  return (
    <AuthPageShell description={t("auth.signUpDescription")} title={t("auth.signUpTitle")}>
      <RegisterForm />
    </AuthPageShell>
  );
}
