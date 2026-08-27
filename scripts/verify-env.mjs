import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabasePlaceholders = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "placeholder-publishable-key",
};

for (const [key, value] of Object.entries(supabasePlaceholders)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const clerkUrlDefaults = {
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/login",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/register",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: "/dashboard",
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: "/dashboard",
};

for (const [key, value] of Object.entries(clerkUrlDefaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const clerkKeys = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
];

for (const key of clerkKeys) {
  const value = process.env[key];
  console.log(`${key}: ${value ? "set" : "missing"}`);
}

for (const [key, value] of Object.entries(supabasePlaceholders)) {
  const isPlaceholder = process.env[key] === value;
  console.log(`${key}: ${isPlaceholder ? "placeholder" : "set"}`);
}

if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
  console.warn(
    "Clerk keys are missing. Auth will not work until NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are set for this build.",
  );
}
