import type { Locale } from "@/lib/i18n/types";
import { enMessages } from "@/lib/i18n/messages/en";
import { frMessages } from "@/lib/i18n/messages/fr";
import { ptMessages } from "@/lib/i18n/messages/pt";

const messageMap = {
  pt: ptMessages,
  en: enMessages,
  fr: frMessages,
} as const;

export function getMessages(locale: Locale) {
  return messageMap[locale];
}
