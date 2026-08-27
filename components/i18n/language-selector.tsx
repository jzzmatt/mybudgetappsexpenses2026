"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_LABELS } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/types";

const localeOrder: Locale[] = ["pt", "en", "fr"];

export function LanguageSelector() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSelect = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  };

  return (
    <div aria-label={t("language.selectLabel")} className="language-selector">
      {localeOrder.map((code) => (
        <button
          aria-current={code === locale ? "true" : undefined}
          aria-label={LOCALE_LABELS[code]}
          className={`language-selector-button${code === locale ? " language-selector-button-active" : ""}`}
          disabled={isPending}
          key={code}
          onClick={() => onSelect(code)}
          type="button"
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
