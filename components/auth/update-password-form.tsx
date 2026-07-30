"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

const schema = z.object({ password: z.string().min(8, "Use at least 8 characters.") });
type FormValues = z.infer<typeof schema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }: FormValues) => {
    setServerError(undefined);
    const { error } = await createSupabaseClient().auth.updateUser({ password });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
    {serverError ? <p className="form-error" role="alert">{serverError}</p> : null}
    <AuthField autoComplete="new-password" error={errors.password?.message} label="New password" type="password" {...register("password")} />
    <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Updating…" : "Update password"}</Button>
  </form>;
}
