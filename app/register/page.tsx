import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <AuthShell description="Create an account to begin managing your budget." title="Create your account"><RegisterForm /></AuthShell>;
}
