import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      description="Enter your email and we'll send a password reset link."
      title="Reset your password"
    >
      <PasswordResetForm />
    </AuthPageShell>
  );
}
