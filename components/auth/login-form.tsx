"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(undefined);
    const { error } = await createSupabaseClient().auth.signInWithPassword({ email, password });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.replace(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      {searchParams.get("error") === "auth_callback" ? <p className="form-error" role="alert">Your sign-in link is invalid or has expired.</p> : null}
      {serverError ? <p className="form-error" role="alert">{serverError}</p> : null}
      <AuthField autoComplete="email" error={errors.email?.message} label="Email" placeholder="you@example.com" type="email" {...register("email")} />
      <AuthField autoComplete="current-password" error={errors.password?.message} label="Password" type="password" {...register("password")} />
      <Link className="auth-link align-end" href="/forgot-password">Forgot password?</Link>
      <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      <p className="auth-footer">Don&apos;t have an account? <Link className="auth-link" href="/register">Create one</Link></p>
    </form>
  );
}
