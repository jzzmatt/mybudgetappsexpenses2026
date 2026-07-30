import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      description="Welcome back! Please enter your details."
      title="Sign in to your account"
    >
      <LoginForm />
    </AuthShell>
  );
}
