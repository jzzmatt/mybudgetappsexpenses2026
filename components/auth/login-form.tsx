"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    if (!isLoaded || !signIn) {
      return;
    }

    setServerError(undefined);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace(searchParams.get("next") ?? "/dashboard");
        router.refresh();
        return;
      }

      setServerError("Additional verification is required before signing in.");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError("Unable to sign in. Please try again.");
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
        autoComplete="email"
        error={errors.email?.message}
        id="login-email"
        label="Email"
        placeholder="Enter your email"
        type="email"
        {...register("email")}
      />
      <AuthField
        autoComplete="current-password"
        error={errors.password?.message}
        id="login-password"
        label="Password"
        placeholder="••••••••"
        type="password"
        {...register("password")}
      />
      <div className="auth-row">
        <label className="auth-remember">
          <input name="remember" type="checkbox" />
          <span>Remember me</span>
        </label>
        <Link className="auth-link" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="auth-divider">
        <span>or</span>
      </p>
      <GoogleAuthButton />
      <p className="auth-footer">
        Don&apos;t have an account?{" "}
        <Link className="auth-link" href="/register">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="auth-description">Loading sign in…</p>}>
      <LoginFormFields />
    </Suspense>
  );
}
