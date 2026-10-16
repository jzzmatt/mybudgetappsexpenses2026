import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { I18nProvider } from "@/lib/i18n/client";
import { getClerkPublishableKey } from "@/lib/clerk/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale, getStaticTranslations } from "@/lib/i18n/server";
import { PWA_APPLE_TOUCH_ICON, PWA_SHORT_NAME, PWA_THEME_COLOR } from "@/lib/pwa/constants";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getStaticTranslations(DEFAULT_LOCALE);

  return {
    title: t("app.name"),
    description: t("app.description"),
    applicationName: PWA_SHORT_NAME,
    appleWebApp: {
      capable: true,
      title: PWA_SHORT_NAME,
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: PWA_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: PWA_THEME_COLOR,
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
        <PwaRegister />
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
