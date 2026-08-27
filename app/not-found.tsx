import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslations } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <AppShell title={t("errors.notFoundTitle")}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px", color: "#111827" }}>
          {t("errors.notFoundTitle")}
        </h2>
        <p
          style={{
            color: "#6b7280",
            fontSize: "15px",
            maxWidth: "420px",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          {t("errors.notFoundDescription")}
        </p>
        <Link className="button button-small" href="/projects">
          {t("errors.notFoundBack")}
        </Link>
      </div>
    </AppShell>
  );
}
