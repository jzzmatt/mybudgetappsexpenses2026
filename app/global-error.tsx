"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: "480px", textAlign: "center", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "32px", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>Something went wrong</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
              {error?.message || "An unexpected error occurred while loading this page. Please try again."}
            </p>
            <Button className="button-small" onClick={() => reset()} type="button">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
