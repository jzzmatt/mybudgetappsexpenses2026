import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthShell description="Welcome back. Enter your details to continue." title="Sign in"><LoginForm /></AuthShell>;
}
