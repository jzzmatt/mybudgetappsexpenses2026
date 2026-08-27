export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  return Boolean(
    publishableKey &&
      secretKey &&
      !publishableKey.includes("placeholder") &&
      !secretKey.includes("placeholder") &&
      publishableKey.startsWith("pk_"),
  );
}

export function getClerkPublishableKey() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
}
