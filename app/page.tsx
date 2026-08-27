import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { safeAuth } from "@/lib/clerk/server";

export default async function Home() {
  const authState = await safeAuth();

  if (authState?.userId) {
    redirect("/projects");
  }

  return <LandingPage />;
}
