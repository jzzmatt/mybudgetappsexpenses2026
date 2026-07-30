import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ForgotPasswordPage() {
  return <AuthShell description="Enter your email and we’ll send a password reset link." title="Reset your password"><PasswordResetForm /></AuthShell>;
}
