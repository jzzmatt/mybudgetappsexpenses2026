import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="dashboard-page">
        <Card className="dashboard-card">
          <p className="auth-brand">Budget App</p>
          <h1>Connect Supabase</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env.local</code>, then add
            your project URL and publishable key from Supabase.
          </p>
        </Card>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <main className="dashboard-page"><Card className="dashboard-card">
    <p className="auth-brand">Budget App</p>
    <h1>Signed in</h1>
    <p>You are signed in as {user.email ?? "your account"}.</p>
    <LogoutButton />
  </Card></main>;
}
