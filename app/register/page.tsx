import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      description="Create an account to begin managing your budget."
      title="Create your account"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
