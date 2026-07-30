import { currentUser } from "@clerk/nextjs/server";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "your account";

  return (
    <main className="dashboard-page">
      <Card className="dashboard-card">
        <p className="auth-brand">BudgetApp</p>
        <h1>Signed in</h1>
        <p>You are signed in as {email}.</p>
        <LogoutButton />
      </Card>
    </main>
  );
}
