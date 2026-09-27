"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency/format";
import { formatExpenseDate } from "@/lib/expenses/format";
import { useTranslations } from "@/lib/i18n/client";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import type { AiCfoChatResponse, AiCfoEvidenceExpense, AiCfoSource } from "@/lib/ai-cfo/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: AiCfoEvidenceExpense[];
  source?: AiCfoSource | null;
};

const ERROR_KEYS = {
  unauthorized: "aiCfo.unauthorized",
  rate_limited: "aiCfo.rateLimited",
  database_unavailable: "aiCfo.dataUnavailable",
  openai_unavailable: "aiCfo.unavailable",
} as const;

export function AiCfoChat() {
  const { t, locale } = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const suggestions = [
    t("aiCfo.suggestionMonth"),
    t("aiCfo.suggestionUnpaid"),
    t("aiCfo.suggestionLargest"),
    t("aiCfo.suggestionByCategory"),
    t("aiCfo.suggestionCompare"),
    t("aiCfo.suggestionLast3Months"),
    t("aiCfo.suggestionBudget"),
    t("aiCfo.suggestionPayment"),
  ];

  async function sendMessage(text: string) {
    const message = text.trim();

    if (!message || pending) {
      return;
    }

    setDraft("");
    setError(null);
    setPending(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/ai-cfo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: conversationId ?? undefined,
        }),
      });
      const payload = (await response.json()) as AiCfoChatResponse & { error?: string };

      if (!response.ok) {
        const key = payload.error && payload.error in ERROR_KEYS ? ERROR_KEYS[payload.error as keyof typeof ERROR_KEYS] : "aiCfo.unavailable";
        setError(t(key));
        return;
      }

      setConversationId(payload.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.reply,
          evidence: payload.evidence,
          source: payload.source,
        },
      ]);
    } catch {
      setError(t("aiCfo.unavailable"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="ai-cfo" aria-labelledby="ai-cfo-heading">
      <div className="ai-cfo-thread" aria-live="polite">
        <article className="ai-cfo-message ai-cfo-message-assistant">
          <p className="ai-cfo-author">{t("aiCfo.title")}</p>
          <p>{t("aiCfo.greeting")}</p>
        </article>

        {messages.length === 0 ? (
          <div className="ai-cfo-suggestions">
            {suggestions.map((suggestion) => (
              <button
                className="ai-cfo-suggestion"
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message) => (
          <article className={`ai-cfo-message ai-cfo-message-${message.role}`} key={message.id}>
            <p className="ai-cfo-author">{message.role === "user" ? t("aiCfo.you") : t("aiCfo.title")}</p>
            <AiCfoReply text={message.content} />
            {message.source ? <AiCfoSourceLine source={message.source} /> : null}
            {message.evidence && message.evidence.length > 0 ? (
              <details className="ai-cfo-evidence">
                <summary>{t("aiCfo.viewEvidence")}</summary>
                <ul>
                  {message.evidence.map((expense) => (
                    <li key={expense.id}>
                      <span>{formatExpenseDate(expense.date, locale)}</span>
                      <span>{expense.description}</span>
                      <span>
                        {formatCurrency(
                          expense.paidAmount,
                          isExpenseCurrency(expense.currency) ? expense.currency : ("KZ" as ExpenseCurrency),
                          locale,
                        )}
                      </span>
                      <span className={`status-badge status-${expense.status}`}>{expense.paymentStatus}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        ))}

        {pending ? <p className="ai-cfo-pending">{t("aiCfo.thinking")}</p> : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="ai-cfo-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(draft);
        }}
      >
        <label className="sr-only" htmlFor="ai-cfo-input">
          {t("aiCfo.placeholder")}
        </label>
        <textarea
          id="ai-cfo-input"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(draft);
            }
          }}
          placeholder={t("aiCfo.placeholder")}
          rows={2}
          value={draft}
        />
        <button className="button button-small" disabled={pending || draft.trim().length === 0} type="submit">
          {t("aiCfo.send")}
        </button>
      </form>
    </section>
  );
}

function AiCfoReply({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="ai-cfo-reply">
      {blocks.map((block) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => line.trim().startsWith("- ") || line.trim().length === 0);

        if (isList) {
          return (
            <ul key={block}>
              {lines
                .map((line) => line.trim().replace(/^- /, ""))
                .filter(Boolean)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
          );
        }

        return <p key={block}>{block}</p>;
      })}
    </div>
  );
}

function AiCfoSourceLine({ source }: { source: AiCfoSource }) {
  const { t } = useTranslations();

  return (
    <p className="ai-cfo-source">
      {t("aiCfo.basedOn")}: {source.expenseCount} {t("aiCfo.expenses")}, {source.categoryCount}{" "}
      {t("aiCfo.categories")}, {source.projectCount} {t("aiCfo.projects")}
      {source.periodLabel ? `. ${t("aiCfo.period")}: ${source.periodLabel}` : ""}
    </p>
  );
}
