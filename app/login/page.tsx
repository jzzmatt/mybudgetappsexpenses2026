import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      description="Welcome back! Please enter your details."
      title="Sign in to your account"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
