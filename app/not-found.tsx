import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function NotFound() {
  return (
    <AppShell title="Page Not Found">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px", color: "#111827" }}>404 - Not Found</h2>
        <p style={{ color: "#6b7280", fontSize: "15px", maxWidth: "420px", marginBottom: "24px", lineHeight: "1.5" }}>
          The project, expense, or resource you are looking for does not exist or has been moved.
        </p>
        <Link className="button button-small" href="/projects">
          Back to My Projects
        </Link>
      </div>
    </AppShell>
  );
}
