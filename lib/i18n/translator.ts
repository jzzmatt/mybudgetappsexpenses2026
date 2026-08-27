import type { Messages, Translator } from "@/lib/i18n/types";

function getNestedValue(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createTranslator(messages: Messages): Translator {
  return function translate(key: string, params?: Record<string, string | number>): string {
    const template = getNestedValue(messages, key) ?? key;

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (_, token: string) => {
      const value = params[token];
      return value === undefined ? "" : String(value);
    });
  };
}

export function translateEnum(
  t: Translator,
  group: "status" | "priority" | "paymentMethod",
  value: string,
): string {
  const key = `${group}.${value}`;
  const translated = t(key);
  return translated === key
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : translated;
}
