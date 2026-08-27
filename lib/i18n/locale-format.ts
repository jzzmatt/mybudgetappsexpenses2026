import type { Locale } from "@/lib/i18n/types";

export function getIntlLocale(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "pt-PT";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
}
