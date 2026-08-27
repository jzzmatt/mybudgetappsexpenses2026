"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { redirectAfterAuth } from "@/lib/clerk/client";

const schema = z.object({
  code: z.string().min(6, "Enter the 6-digit code from your email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function UpdatePasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ code, password }: FormValues) => {
    if (!isLoaded || !signIn) {
      return;
    }

    setServerError(undefined);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        redirectAfterAuth("/dashboard");
        return;
      }

      setServerError("Unable to reset your password. Check the code and try again.");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError("Unable to reset your password. Please try again.");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}
      <AuthField
        autoComplete="one-time-code"
        error={errors.code?.message}
        id="reset-code"
        inputMode="numeric"
        label="Reset code"
        placeholder="Enter the code from your email"
        type="text"
        {...register("code")}
      />
      <AuthField
        autoComplete="new-password"
        error={errors.password?.message}
        id="reset-password"
        label="New password"
        placeholder="••••••••"
        type="password"
        {...register("password")}
      />
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
