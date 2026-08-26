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

const required = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

const missing = required.filter((key) => !process.env[key]);

for (const key of required) {
  console.log(`${key}: ${process.env[key] ? "set" : "MISSING"}`);
}

if (missing.length > 0) {
  if (process.env.VERCEL || process.env.CI) {
    console.warn(
      `\nWarning: Missing environment variables during CI build: ${missing.join(", ")}. Using fallback stubs for static optimization.`,
    );
  } else {
    console.warn(
      `\nWarning: Missing environment variables: ${missing.join(", ")}.`,
    );
  }
}
