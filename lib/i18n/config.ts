import type { Locale } from "@/lib/i18n/types";

export const LOCALE_COOKIE = "budget-locale";

export const LOCALES = ["pt", "en", "fr"] as const;

export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
  fr: "FR",
};
