"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency/format";
import { formatExpenseDate } from "@/lib/expenses/format";
import { useTranslations } from "@/lib/i18n/client";
import { isExpenseCurrency, type ExpenseCurrency } from "@/lib/currency/types";
import type { AiCfoChatResponse, AiCfoEvidenceExpense, AiCfoProjectRef, AiCfoSource } from "@/lib/ai-cfo/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: AiCfoEvidenceExpense[];
  source?: AiCfoSource | null;
  projects?: AiCfoProjectRef[];
  originalQuestion?: string;
  allowMultiple?: boolean;
  queryProjectName?: string | null;
};

const ERROR_KEYS = {
  unauthorized: "aiCfo.unauthorized",
  rate_limited: "aiCfo.rateLimited",
  database_unavailable: "aiCfo.dataUnavailable",
  openai_unavailable: "aiCfo.unavailable",
} as const;

type AiCfoChatProps = {
  projects: AiCfoProjectRef[];
};

export function AiCfoChat({ projects }: AiCfoChatProps) {
  const { t, locale } = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<AiCfoProjectRef | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      `${project.name} ${project.description ?? ""}`.toLowerCase().includes(query),
    );
  }, [projects, search]);

  async function postChat(body: Record<string, unknown>) {
    const response = await fetch("/api/ai-cfo/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        conversationId: conversationId ?? undefined,
        activeProjectId: activeProject?.id,
      }),
    });
    const payload = (await response.json()) as AiCfoChatResponse & { error?: string };

    if (!response.ok) {
      const key = payload.error && payload.error in ERROR_KEYS ? ERROR_KEYS[payload.error as keyof typeof ERROR_KEYS] : "aiCfo.unavailable";
      throw new Error(t(key));
    }

    return payload;
  }

  function applyPayload(payload: AiCfoChatResponse, asSelection: boolean) {
    setConversationId(payload.conversationId);
    if (payload.projectContext) {
      setActiveProject(payload.projectContext);
    }

    if (payload.type === "answer") {
      setPendingQuestion(null);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.message,
          evidence: payload.evidence,
          source: payload.source,
          queryProjectName:
            payload.queryProject && payload.queryProject.id !== payload.projectContext?.id
              ? payload.queryProject.name
              : null,
        },
      ]);
      return;
    }

    setPendingQuestion(payload.originalQuestion ?? null);
    if (!asSelection) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.message,
        projects: payload.projects,
        originalQuestion: payload.originalQuestion,
        allowMultiple: payload.allowMultiple,
      },
    ]);
  }

  async function sendMessage(text: string) {
    const message = text.trim();

    if (!message || pending) {
      return;
    }

    setDraft("");
    setError(null);
    setPending(true);
    setPickerOpen(false);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message }]);

    try {
      const payload = await postChat({ intent: "ask", message });
      applyPayload(payload, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    } finally {
      setPending(false);
    }
  }

  async function chooseProjects(projectIds: string[], originalQuestion?: string) {
    if (pending || projectIds.length === 0) {
      return;
    }

    setPending(true);
    setError(null);
    setPickerOpen(false);

    try {
      const question = originalQuestion ?? pendingQuestion ?? undefined;
      const payload = await postChat(
        question
          ? {
              intent: "select_project",
              projectId: projectIds[0],
              projectIds,
              originalQuestion: question,
            }
          : {
              intent: "change_project",
              projectId: projectIds[0],
            },
      );
      applyPayload(payload, false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    } finally {
      setPending(false);
      setSelectedIds([]);
    }
  }

  return (
    <section className="ai-cfo" aria-labelledby="ai-cfo-heading">
      <div className="ai-cfo-project-bar">
        <span id="ai-cfo-project-label">{t("aiCfo.projectLabel")}</span>
        <button
          aria-expanded={pickerOpen}
          aria-haspopup="dialog"
          aria-labelledby="ai-cfo-project-label"
          className="ai-cfo-project-trigger"
          onClick={() => setPickerOpen((open) => !open)}
          type="button"
        >
          <span>{activeProject?.name ?? t("aiCfo.selectProject")}</span>
          <span aria-hidden="true">▾</span>
        </button>
        {pickerOpen ? (
          <ProjectPicker
            allowMultiple={false}
            emptyLabel={t("aiCfo.noProjects")}
            onClose={() => setPickerOpen(false)}
            onSearch={setSearch}
            onSelect={(projectId) => {
              void chooseProjects([projectId], pendingQuestion ?? undefined);
            }}
            onToggle={(projectId) => {
              setSelectedIds((current) =>
                current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
              );
            }}
            projects={visibleProjects}
            search={search}
            searchLabel={t("aiCfo.searchProjects")}
            selectLabel={t("aiCfo.select")}
            selectedIds={selectedIds}
            title={t("aiCfo.changeProject")}
          />
        ) : null}
      </div>

      <div className="ai-cfo-thread" aria-live="polite">
        <article className="ai-cfo-message ai-cfo-message-assistant">
          <p className="ai-cfo-author">{t("aiCfo.title")}</p>
          <p>{t("aiCfo.greeting")}</p>
        </article>

        {messages.length === 0 ? (
          <div className="ai-cfo-suggestions">
            {suggestions.map((suggestion) => (
              <button className="ai-cfo-suggestion" key={suggestion} onClick={() => sendMessage(suggestion)} type="button">
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message) => (
          <article className={`ai-cfo-message ai-cfo-message-${message.role}`} key={message.id}>
            <p className="ai-cfo-author">{message.role === "user" ? t("aiCfo.you") : t("aiCfo.title")}</p>
            <AiCfoReply text={message.content} />
            {message.queryProjectName ? <p className="ai-cfo-source">{t("aiCfo.answeredUsing", { name: message.queryProjectName })}</p> : null}
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
            {message.projects && message.projects.length > 0 ? (
              <ProjectChoices
                allowMultiple={message.allowMultiple}
                applyLabel={t("aiCfo.applyProjects")}
                onApply={(ids) => chooseProjects(ids, message.originalQuestion)}
                onSelect={(projectId) => chooseProjects([projectId], message.originalQuestion)}
                projects={message.projects}
                selectLabel={t("aiCfo.select")}
              />
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

function ProjectChoices({
  projects,
  allowMultiple,
  selectLabel,
  applyLabel,
  onSelect,
  onApply,
}: {
  projects: AiCfoProjectRef[];
  allowMultiple?: boolean;
  selectLabel: string;
  applyLabel: string;
  onSelect: (projectId: string) => void;
  onApply: (projectIds: string[]) => void;
}) {
  const [chosen, setChosen] = useState<string[]>([]);

  return (
    <div className="ai-cfo-project-list">
      {projects.map((project) => (
        <article className="ai-cfo-project-card" key={project.id}>
          <div>
            <h3>{project.name}</h3>
            {project.description ? <p>{project.description}</p> : null}
          </div>
          {allowMultiple ? (
            <label className="ai-cfo-project-check">
              <input
                checked={chosen.includes(project.id)}
                onChange={() => {
                  setChosen((current) =>
                    current.includes(project.id) ? current.filter((id) => id !== project.id) : [...current, project.id],
                  );
                }}
                type="checkbox"
              />
              <span>{selectLabel}</span>
            </label>
          ) : (
            <button className="button button-outline button-small" onClick={() => onSelect(project.id)} type="button">
              {selectLabel}
            </button>
          )}
        </article>
      ))}
      {allowMultiple ? (
        <button className="button button-small" disabled={chosen.length === 0} onClick={() => onApply(chosen)} type="button">
          {applyLabel}
        </button>
      ) : null}
    </div>
  );
}

function ProjectPicker({
  title,
  projects,
  search,
  searchLabel,
  selectLabel,
  emptyLabel,
  allowMultiple,
  selectedIds,
  onSearch,
  onSelect,
  onToggle,
  onClose,
}: {
  title: string;
  projects: AiCfoProjectRef[];
  search: string;
  searchLabel: string;
  selectLabel: string;
  emptyLabel: string;
  allowMultiple: boolean;
  selectedIds: string[];
  onSearch: (value: string) => void;
  onSelect: (projectId: string) => void;
  onToggle: (projectId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="ai-cfo-project-sheet" role="dialog" aria-label={title}>
      <div className="ai-cfo-project-sheet-card">
        <div className="ai-cfo-project-sheet-header">
          <h2>{title}</h2>
          <button className="button button-outline button-small" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <input
          aria-label={searchLabel}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={searchLabel}
          type="search"
          value={search}
        />
        <ul>
          {projects.length === 0 ? <li>{emptyLabel}</li> : null}
          {projects.map((project) => (
            <li key={project.id}>
              <button
                onClick={() => (allowMultiple ? onToggle(project.id) : onSelect(project.id))}
                type="button"
              >
                <strong>{project.name}</strong>
                {project.description ? <span>{project.description}</span> : null}
                {allowMultiple && selectedIds.includes(project.id) ? <em>{selectLabel}</em> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
