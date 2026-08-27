import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translator";
import type { Locale } from "@/lib/i18n/types";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;

  if (value && isLocale(value)) {
    return value;
  }

  return DEFAULT_LOCALE;
}

export async function getTranslations() {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return {
    locale,
    messages,
    t: createTranslator(messages),
  };
}
