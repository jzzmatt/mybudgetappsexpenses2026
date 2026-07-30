"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(undefined);
    const { error } = await createSupabaseClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setMessage("Check your email to confirm your account before signing in.");
  };

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
    {message ? <p className="form-success" role="status">{message}</p> : null}
    {serverError ? <p className="form-error" role="alert">{serverError}</p> : null}
    <AuthField autoComplete="email" error={errors.email?.message} label="Email" placeholder="you@example.com" type="email" {...register("email")} />
    <AuthField autoComplete="new-password" error={errors.password?.message} label="Password" type="password" {...register("password")} />
    <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account…" : "Create account"}</Button>
    <p className="auth-footer">Already have an account? <Link className="auth-link" href="/login">Sign in</Link></p>
  </form>;
}
