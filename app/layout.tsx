import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/client";
import { getClerkPublishableKey } from "@/lib/clerk/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale, getStaticTranslations } from "@/lib/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getStaticTranslations(DEFAULT_LOCALE);

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
  const publishableKey = getClerkPublishableKey();
  const locale = await getLocale();
  const messages = getMessages(locale);

  const body = (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );

  if (!publishableKey) {
    return body;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {body}
    </ClerkProvider>
  );
}
