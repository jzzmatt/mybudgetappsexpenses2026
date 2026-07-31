import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthPageShell
      description="Choose a new password for your account."
      title="Set a new password"
    >
      <UpdatePasswordForm />
    </AuthPageShell>
  );
}
