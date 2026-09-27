export function normalizeWhatsAppNumber(input: string) {
  const compact = input.trim().replace(/[\s().-]/g, "");
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact;
  const digits = withoutPlus.startsWith("00") ? withoutPlus.slice(2) : withoutPlus;

  if (!/^\d+$/.test(digits) || digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    return { ok: false as const, error: "invalid_phone" };
  }

  return { ok: true as const, e164: digits, display: `+${digits}` };
}
