import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk/config";

export async function safeCurrentUser() {
  if (!isClerkConfigured()) {
    return null;
  }

  return await currentUser();
}

export async function safeAuth() {
  if (!isClerkConfigured()) {
    return null;
  }

  return await auth();
}
