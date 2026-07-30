import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return <AuthShell description="Choose a new password for your account." title="Set a new password"><UpdatePasswordForm /></AuthShell>;
}
