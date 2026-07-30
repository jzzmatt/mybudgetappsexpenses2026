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
  console.error(
    `\nBuild aborted. Add these Vercel environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}
