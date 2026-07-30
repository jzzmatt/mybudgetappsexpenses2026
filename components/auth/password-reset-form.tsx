"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type FormValues = z.infer<typeof schema>;

export function PasswordResetForm() {
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    setServerError(undefined);
    const { error } = await createSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setMessage("If an account exists for that address, we sent a reset link.");
  };

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
    {message ? <p className="form-success" role="status">{message}</p> : null}
    {serverError ? <p className="form-error" role="alert">{serverError}</p> : null}
    <AuthField autoComplete="email" error={errors.email?.message} label="Email" placeholder="you@example.com" type="email" {...register("email")} />
    <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Sending…" : "Send reset link"}</Button>
    <p className="auth-footer"><Link className="auth-link" href="/login">Back to sign in</Link></p>
  </form>;
}
