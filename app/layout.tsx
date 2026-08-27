import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/client";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();

  return {
    title: t("app.name"),
    description: t("app.description"),
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_key_for_build_purposes";
  const locale = await getLocale();
  const messages = getMessages(locale);

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang={locale}>
        <body>
          <I18nProvider locale={locale} messages={messages}>
            {children}
          </I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
