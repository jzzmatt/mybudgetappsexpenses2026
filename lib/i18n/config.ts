export const LOCALE_COOKIE = "budget-locale";

export const LOCALES = ["pt", "en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
  fr: "FR",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
