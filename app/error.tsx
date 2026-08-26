"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error caught by boundary:", error);
  }, [error]);

  return (
    <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", textAlign: "center", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>Unable to load page</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
          {error?.message || "An unexpected error occurred while communicating with the database."}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button className="button-small" onClick={() => reset()} type="button">
            Try again
          </Button>
          <Link className="button button-outline button-small" href="/projects" style={{ textDecoration: "none" }}>
            Return to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
