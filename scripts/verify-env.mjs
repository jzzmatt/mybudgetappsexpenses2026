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

const placeholders = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_placeholder_key_for_build_purposes",
  CLERK_SECRET_KEY: "sk_test_placeholder_key_for_build_purposes",
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "placeholder-publishable-key",
};

const required = Object.keys(placeholders);

for (const key of required) {
  if (!process.env[key]) {
    process.env[key] = placeholders[key];
  }
}

for (const key of required) {
  const value = process.env[key];
  const isPlaceholder = value === placeholders[key];
  console.log(`${key}: ${isPlaceholder ? "placeholder" : "set"}`);
}
