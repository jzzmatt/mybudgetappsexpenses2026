import type { Locale } from "@/lib/i18n/config";
import { resolveProjectContext, type CfoProject, type ProjectContextDecision } from "@/lib/ai-cfo/project-context";

export type FavoriteQuestion = {
  id: string;
  userId: string;
  title: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
};

const PAYMENT_TITLE: Record<Locale, string> = {
  en: "Payment Status",
  pt: "Estado do pagamento",
  fr: "Statut du paiement",
};

const UNPAID_TITLE: Record<Locale, string> = {
  en: "Unpaid Expenses",
  pt: "Despesas por pagar",
  fr: "Dépenses impayées",
};

export function normalizeFavoriteQuestion(question: string) {
  return question
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function findDuplicateFavorite<T extends { id: string; question: string }>(
  favorites: T[],
  question: string,
  ignoreId?: string,
) {
  const needle = normalizeFavoriteQuestion(question);
  return favorites.find((favorite) => favorite.id !== ignoreId && normalizeFavoriteQuestion(favorite.question) === needle) ?? null;
}

export function suggestFavoriteTitle(question: string, locale: Locale = "en") {
  const cleaned = question.replace(/\s+/g, " ").trim().replace(/[?？.]+$/g, "");

  if (/\b(unpaid|por pagar|impay)/i.test(cleaned)) {
    return UNPAID_TITLE[locale];
  }

  const payment = cleaned.match(/\b(?:was|foi|est-ce que)\s+(.+?)\s+(?:paid|pago|paye|payé)\b/i);
  if (payment?.[1]) {
    return `${trimTitle(payment[1])} — ${PAYMENT_TITLE[locale]}`;
  }

  const subject = cleaned.match(/\b(?:on|na|sur)\s+(.+?)(?:\s+(?:in|em|durante|during|this|este|cette)\s+(.+))?$/i);
  if (subject?.[1]) {
    const name = trimTitle(subject[1]);
    const period = subject[2] ? trimTitle(subject[2]) : "";
    return period ? `${name} — ${period}` : name;
  }

  return trimTitle(cleaned);
}

export function favoriteAccess(favorite: { userId: string } | null, sessionUserId: string) {
  if (!favorite || favorite.userId !== sessionUserId) {
    return "not_found" as const;
  }

  return "allowed" as const;
}

export function canAddFavorite(count: number, maxFavorites: number) {
  return count < maxFavorites;
}

export function getFavoriteLimit(raw = process.env.AI_CFO_MAX_FAVORITES) {
  const parsed = Number(raw ?? "20");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 20;
}

export function sortFavorites<T extends { lastUsedAt: string | null; createdAt: string }>(favorites: T[]) {
  return [...favorites].sort((left, right) => {
    if (left.lastUsedAt && right.lastUsedAt && left.lastUsedAt !== right.lastUsedAt) {
      return right.lastUsedAt.localeCompare(left.lastUsedAt);
    }

    if (left.lastUsedAt && !right.lastUsedAt) {
      return -1;
    }

    if (!left.lastUsedAt && right.lastUsedAt) {
      return 1;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function favoriteExecutionInput(favorite: Pick<FavoriteQuestion, "question">) {
  return {
    message: favorite.question,
    storesAnswer: false as const,
  };
}

export function resolveFavoriteProject(input: {
  question: string;
  projects: CfoProject[];
  activeProjectId?: string | null;
}): ProjectContextDecision {
  return resolveProjectContext({
    message: input.question,
    projects: input.projects,
    activeProjectId: input.activeProjectId,
  });
}

function trimTitle(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim().replace(/[?？.]+$/g, "");
  return cleaned.length > 80 ? `${cleaned.slice(0, 77).trim()}…` : cleaned;
}
