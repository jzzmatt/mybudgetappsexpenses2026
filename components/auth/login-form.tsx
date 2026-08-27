"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";

type FormValues = {
  email: string;
  password: string;
};

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { t } = useTranslations();
  const [serverError, setServerError] = useState<string>();

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.emailInvalid")),
        password: z.string().min(1, t("validation.passwordRequired")),
      }),
    [t],
  );

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

      setServerError(t("auth.verificationRequired"));
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError(t("auth.signInError"));
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
        label={t("auth.email")}
        placeholder={t("auth.emailPlaceholder")}
        type="email"
        {...register("email")}
      />
      <AuthField
        autoComplete="current-password"
        error={errors.password?.message}
        id="login-password"
        label={t("auth.password")}
        placeholder={t("auth.passwordPlaceholder")}
        type="password"
        {...register("password")}
      />
      <div className="auth-row">
        <label className="auth-remember">
          <input name="remember" type="checkbox" />
          <span>{t("auth.rememberMe")}</span>
        </label>
        <Link className="auth-link" href="/forgot-password">
          {t("auth.forgotPassword")}
        </Link>
      </div>
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
      <p className="auth-divider">
        <span>{t("common.or")}</span>
      </p>
      <GoogleAuthButton />
      <p className="auth-footer">
        {t("auth.noAccount")}{" "}
        <Link className="auth-link" href="/register">
          {t("auth.signUp")}
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const { t } = useTranslations();

  return (
    <Suspense fallback={<p className="auth-description">{t("auth.loadingSignIn")}</p>}>
      <LoginFormFields />
    </Suspense>
  );
}
