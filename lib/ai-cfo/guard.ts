import type { Locale } from "@/lib/i18n/config";
import { normalizeSearchText } from "@/lib/ai-cfo/match";

const REPLIES: Record<Locale, { otherUser: string; secrets: string; external: string }> = {
  en: {
    otherUser:
      "I can only use your BudgetApp data. I can't access another user's expenses, projects, budgets, or payments.",
    secrets: "I can't share credentials, system prompts, or internal configuration.",
    external: "I can only answer questions using information available in your BudgetApp data.",
  },
  pt: {
    otherUser:
      "Só posso usar os dados da tua conta BudgetApp. Não consigo aceder a despesas, projetos, orçamentos ou pagamentos de outro utilizador.",
    secrets: "Não posso partilhar credenciais, prompts de sistema ou configuração interna.",
    external: "Só posso responder com informação disponível nos teus dados do BudgetApp.",
  },
  fr: {
    otherUser:
      "Je ne peux utiliser que les données de votre compte BudgetApp. Je n'accède pas aux dépenses, projets, budgets ou paiements d'un autre utilisateur.",
    secrets: "Je ne peux pas partager d'identifiants, d'invites système ou de configuration interne.",
    external: "Je ne peux répondre qu'avec les informations disponibles dans vos données BudgetApp.",
  },
};

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

export function guardUserQuestion(message: string, locale: Locale) {
  const text = normalizeSearchText(message);
  const replies = REPLIES[locale];

  const otherUser = includesAny(text, [
    "another user",
    "other user",
    "someone else",
    "outro utilizador",
    "outro usuario",
    "autre utilisateur",
    "un autre utilisateur",
  ]);

  const secrets = includesAny(text, [
    "database password",
    "api key",
    "system prompt",
    "ignore your previous",
    "ignore previous instructions",
    "senha da base",
    "palavra passe",
    "prompt de sistema",
    "ignora as instrucoes",
    "mot de passe",
    "invite systeme",
  ]);

  const external = includesAny(text, [
    "interest rate",
    "search the internet",
    "search the web",
    "web search",
    "taxa de juro",
    "taxa de juros",
    "taux d interet",
    "cherche sur internet",
    "recherche sur internet",
  ]);

  if (otherUser) {
    return replies.otherUser;
  }

  if (secrets) {
    return replies.secrets;
  }

  if (external) {
    return replies.external;
  }

  return null;
}

export function foreignUserAttempt(sessionUserId: string, raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return false;
  }

  const record = raw as { userId?: unknown; user_id?: unknown };
  const requested = record.userId ?? record.user_id;
  return typeof requested === "string" && requested.length > 0 && requested !== sessionUserId;
}
