export const CLERK_PUBLISHABLE_KEY_PLACEHOLDER = "pk_test_placeholder_key_for_build_purposes";
export const CLERK_SECRET_KEY_PLACEHOLDER = "sk_test_placeholder_key_for_build_purposes";

export function isClerkPublishableKeyPlaceholder(value: string | undefined) {
  return !value || value === CLERK_PUBLISHABLE_KEY_PLACEHOLDER || value.includes("placeholder");
}

export function isClerkSecretKeyPlaceholder(value: string | undefined) {
  return !value || value === CLERK_SECRET_KEY_PLACEHOLDER || value.includes("placeholder");
}

export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  return Boolean(
    publishableKey &&
      secretKey &&
      !isClerkPublishableKeyPlaceholder(publishableKey) &&
      !isClerkSecretKeyPlaceholder(secretKey) &&
      publishableKey.startsWith("pk_") &&
      secretKey.startsWith("sk_"),
  );
}

export function getClerkPublishableKey() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey || isClerkPublishableKeyPlaceholder(publishableKey)) {
    return null;
  }

  return publishableKey;
}
