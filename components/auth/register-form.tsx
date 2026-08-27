"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignUp } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

export function RegisterForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { t } = useTranslations();
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t("validation.emailInvalid")),
        password: z.string().min(8, t("validation.passwordRequired")),
      }),
    [t],
  );

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
        setMessage(t("auth.verificationRequired"));
        return;
      }

      setMessage(t("auth.signUp"));
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError(t("errors.generic"));
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
        label={t("auth.email")}
        placeholder={t("auth.emailPlaceholder")}
        type="email"
        {...register("email")}
      />
      <AuthField
        autoComplete="new-password"
        error={errors.password?.message}
        id="register-password"
        label={t("auth.password")}
        placeholder={t("auth.passwordPlaceholder")}
        type="password"
        {...register("password")}
      />
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? t("auth.signingUp") : t("auth.signUp")}
      </Button>
      <p className="auth-divider">
        <span>{t("common.or")}</span>
      </p>
      <GoogleAuthButton />
      <p className="auth-footer">
        {t("auth.hasAccount")}{" "}
        <Link className="auth-link" href="/login">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
