"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs/legacy";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type FormValues = z.infer<typeof schema>;

export function PasswordResetForm() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    if (!isLoaded || !signIn) {
      return;
    }

    setServerError(undefined);
    setMessage(undefined);

    try {
      const result = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      const emailCodeFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code",
      );

      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        setServerError("Password reset is not available for this account.");
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setMessage("We sent a reset code to your email.");
      router.push("/update-password");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setServerError(error.errors[0]?.longMessage ?? error.errors[0]?.message);
        return;
      }

      setServerError("Unable to send a reset code. Please try again.");
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
        id="reset-email"
        label="Email"
        placeholder="Enter your email"
        type="email"
        {...register("email")}
      />
      <Button disabled={!isLoaded || isSubmitting} type="submit">
        {isSubmitting ? "Sending…" : "Send reset code"}
      </Button>
      <p className="auth-footer">
        <Link className="auth-link" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
