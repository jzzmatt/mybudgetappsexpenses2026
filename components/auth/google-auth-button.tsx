"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GoogleAuthButton() {
  const pathname = usePathname();
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const isRegister = pathname === "/register";
  const isLoaded = isRegister ? isSignUpLoaded : isSignInLoaded;

  const continueWithGoogle = async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      if (isRegister && signUp) {
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/dashboard",
        });
        return;
      }

      if (signIn) {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/dashboard",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to continue with Google.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-oauth">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="button-outline"
        disabled={!isLoaded || isLoading}
        onClick={continueWithGoogle}
        type="button"
      >
        {isLoading ? "Redirecting…" : "Continue with Google"}
      </Button>
    </div>
  );
}
