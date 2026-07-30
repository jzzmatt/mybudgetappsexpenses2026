"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignUp } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormValues) => {
    if (!isLoaded || !signUp) {
      return;
    }

    setServerError(undefined);
    setMessage(undefined);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      if (signUp.status === "complete") {
        await setActive({ session: signUp.createdSessionId });
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (
        signUp.status === "missing_requirements" &&
        signUp.unverifiedFields.includes("email_address")
      ) {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setMessage(
          "Check your email for a verification code, then sign in once verified.",
        );
        return;
      }

      setMessage("Account created. You can now sign in.");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError("Unable to create your account. Please try again.");
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      {message ? (
        <p className="form-success" role="status">
          {message}
        </p>
      ) : null}
      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}
      <AuthField
        autoComplete="email"
        error={errors.email?.message}
        id="register-email"
        label="Email"
        placeholder="Enter your email"
        type="email"
        {...register("email")}
      />
      <AuthField
        autoComplete="new-password"
        error={errors.password?.message}
        id="register-password"
        label="Password"
        placeholder="••••••••"
        type="password"
        {...register("password")}
      />
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="auth-divider">
        <span>or</span>
      </p>
      <GoogleAuthButton />
      <p className="auth-footer">
        Already have an account?{" "}
        <Link className="auth-link" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
