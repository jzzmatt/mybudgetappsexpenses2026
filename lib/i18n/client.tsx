"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator } from "@/lib/i18n/translator";
import type { Locale } from "@/lib/i18n/config";
import type { Messages, Translator } from "@/lib/i18n/types";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: Translator;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
};

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      messages,
      t: createTranslator(messages),
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}

export function useTranslations() {
  return useI18n();
}
