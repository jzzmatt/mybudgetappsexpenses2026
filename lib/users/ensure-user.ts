import { currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureUserRecord() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
        full_name: fullName || null,
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("users upsert error in ensureUserRecord:", error.message);
    }
  } catch (err) {
    console.error("ensureUserRecord failed:", err);
  }

  return user.id;
}
