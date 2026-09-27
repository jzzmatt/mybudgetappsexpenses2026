"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { formatCurrency } from "@/lib/currency/format";
import { formatExpenseDate } from "@/lib/expenses/format";
import { normalizeFavoriteQuestion, suggestFavoriteTitle } from "@/lib/ai-cfo/favorites";
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
  favoriteProjectName?: string | null;
  favoriteId?: string;
};

type FavoriteItem = {
  id: string;
  title: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
};

type FavoriteEditor = {
  mode: "create" | "edit";
  id?: string;
  title: string;
  question: string;
};

const CHAT_ERROR_KEYS = {
  unauthorized: "aiCfo.unauthorized",
  rate_limited: "aiCfo.rateLimited",
  database_unavailable: "aiCfo.dataUnavailable",
  openai_unavailable: "aiCfo.unavailable",
  not_found: "aiCfo.unavailable",
} as const;

const FAVORITE_ERROR_KEYS = {
  ...CHAT_ERROR_KEYS,
  duplicate: "aiCfo.duplicateFavorite",
  limit_reached: "aiCfo.favoriteLimit",
  not_found: "aiCfo.favoriteMissing",
} as const;

type AiCfoChatProps = {
  projects: AiCfoProjectRef[];
};

function subscribeDesktop(onStoreChange: () => void) {
  const media = window.matchMedia("(min-width: 901px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function readDesktop() {
  return window.matchMedia("(min-width: 901px)").matches;
}

export function AiCfoChat({ projects }: AiCfoChatProps) {
  const { t, locale } = useTranslations();
  const isDesktop = useSyncExternalStore(subscribeDesktop, readDesktop, () => false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<AiCfoProjectRef | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteQuery, setFavoriteQuery] = useState("");
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editor, setEditor] = useState<FavoriteEditor | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorPending, setEditorPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const visibleFavorites = useMemo(() => {
    const query = normalizeFavoriteQuestion(favoriteQuery);
    if (!query) {
      return favorites;
    }

    return favorites.filter((favorite) =>
      normalizeFavoriteQuestion(`${favorite.title} ${favorite.question}`).includes(query),
    );
  }, [favoriteQuery, favorites]);

  const loadFavorites = useCallback(async () => {
    try {
      const response = await fetch("/api/ai-cfo/favorites");
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { favorites?: FavoriteItem[] };
      setFavorites(payload.favorites ?? []);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/ai-cfo/favorites", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { favorites?: FavoriteItem[] };
        setFavorites(payload.favorites ?? []);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  function errorMessage(code: string | undefined, favorite = false) {
    const keys = favorite ? FAVORITE_ERROR_KEYS : CHAT_ERROR_KEYS;
    const key = code && code in keys ? keys[code as keyof typeof keys] : "aiCfo.unavailable";
    return t(key);
  }

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
      throw new Error(errorMessage(payload.error));
    }

    return payload;
  }

  function applyPayload(payload: AiCfoChatResponse, asSelection: boolean, favoriteId?: string | null) {
    const trackedFavorite = favoriteId ?? payload.favoriteId ?? null;
    setConversationId(payload.conversationId);
    if (payload.projectContext) {
      setActiveProject(payload.projectContext);
    }

    if (payload.type === "answer") {
      setPendingQuestion(null);
      if (trackedFavorite) {
        setPendingFavoriteId(null);
        void loadFavorites();
      }

      const analyzedName = payload.queryProject?.name ?? payload.projectContext?.name ?? null;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.message,
          evidence: payload.evidence,
          source: payload.source,
          queryProjectName:
            trackedFavorite
              ? null
              : payload.queryProject && payload.queryProject.id !== payload.projectContext?.id
                ? payload.queryProject.name
                : null,
          favoriteProjectName: trackedFavorite ? analyzedName : null,
        },
      ]);
      return;
    }

    setPendingQuestion(payload.originalQuestion ?? null);
    if (trackedFavorite) {
      setPendingFavoriteId(trackedFavorite);
    }
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
        favoriteId: trackedFavorite ?? undefined,
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
    setNotice(null);
    setPendingFavoriteId(null);
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

  async function chooseProjects(projectIds: string[], originalQuestion?: string, favoriteId?: string) {
    if (pending || projectIds.length === 0) {
      return;
    }

    setPending(true);
    setError(null);
    setPickerOpen(false);

    try {
      const question = originalQuestion ?? pendingQuestion ?? undefined;
      const trackedFavorite = question ? (favoriteId ?? pendingFavoriteId ?? undefined) : undefined;
      const payload = await postChat(
        question
          ? {
              intent: "select_project",
              projectId: projectIds[0],
              projectIds,
              originalQuestion: question,
              favoriteId: trackedFavorite,
            }
          : {
              intent: "change_project",
              projectId: projectIds[0],
            },
      );
      applyPayload(payload, false, trackedFavorite);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    } finally {
      setPending(false);
      setSelectedIds([]);
    }
  }

  async function runFavorite(favorite: FavoriteItem) {
    if (pending) {
      return;
    }

    setMenuId(null);
    setError(null);
    setNotice(null);
    setPending(true);
    setPickerOpen(false);
    setPendingFavoriteId(favorite.id);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: favorite.question, favoriteId: favorite.id },
    ]);

    try {
      const response = await fetch(`/api/ai-cfo/favorites/${favorite.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          activeProjectId: activeProject?.id,
        }),
      });
      const payload = (await response.json()) as AiCfoChatResponse & { error?: string };

      if (!response.ok) {
        throw new Error(errorMessage(payload.error, true));
      }

      applyPayload(payload, true, favorite.id);
    } catch (caught) {
      setPendingFavoriteId(null);
      setError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    } finally {
      setPending(false);
    }
  }

  function favoriteForQuestion(question: string) {
    const needle = normalizeFavoriteQuestion(question);
    return favorites.find((favorite) => normalizeFavoriteQuestion(favorite.question) === needle) ?? null;
  }

  function openCreate(question: string) {
    setEditorError(null);
    setEditor({
      mode: "create",
      title: suggestFavoriteTitle(question, locale),
      question,
    });
  }

  function openEdit(favorite: FavoriteItem) {
    setMenuId(null);
    setEditorError(null);
    setEditor({
      mode: "edit",
      id: favorite.id,
      title: favorite.title,
      question: favorite.question,
    });
  }

  async function saveEditor() {
    if (!editor || editorPending) {
      return;
    }

    const title = editor.title.trim();
    const question = editor.question.trim();

    if (!title || !question) {
      return;
    }

    setEditorPending(true);
    setEditorError(null);

    try {
      const response = await fetch(editor.mode === "edit" && editor.id ? `/api/ai-cfo/favorites/${editor.id}` : "/api/ai-cfo/favorites", {
        method: editor.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, question }),
      });
      const payload = (await response.json()) as { error?: string; favorite?: FavoriteItem };

      if (!response.ok || !payload.favorite) {
        throw new Error(errorMessage(payload.error, true));
      }

      setFavorites((current) => {
        const next = current.filter((favorite) => favorite.id !== payload.favorite?.id);
        return [payload.favorite as FavoriteItem, ...next];
      });
      void loadFavorites();
      setEditor(null);
      setFavoritesOpen(true);
      setNotice(t("aiCfo.savedToFavorites"));
    } catch (caught) {
      setEditorError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    } finally {
      setEditorPending(false);
    }
  }

  async function removeFavorite(id: string) {
    setMenuId(null);
    setError(null);

    try {
      const response = await fetch(`/api/ai-cfo/favorites/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(errorMessage(payload.error, true));
      }

      setFavorites((current) => current.filter((favorite) => favorite.id !== id));
      if (pendingFavoriteId === id) {
        setPendingFavoriteId(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("aiCfo.unavailable"));
    }
  }

  const favoritesVisible = isDesktop || favoritesOpen;

  return (
    <section className="ai-cfo" aria-labelledby="ai-cfo-heading">
      <aside className={`ai-cfo-favorites${favoritesVisible ? " is-open" : ""}`}>
        <button
          aria-controls="ai-cfo-favorites-panel"
          aria-expanded={favoritesVisible}
          className="ai-cfo-favorites-toggle"
          onClick={() => {
            if (!isDesktop) {
              setFavoritesOpen((open) => !open);
            }
          }}
          type="button"
        >
          <span>{t("aiCfo.favoriteQuestions")}</span>
          <span aria-hidden="true" className="ai-cfo-favorites-chevron">
            {favoritesOpen ? "▴" : "▾"}
          </span>
        </button>
        <div className="ai-cfo-favorites-body" id="ai-cfo-favorites-panel">
          <input
            aria-label={t("aiCfo.searchFavorites")}
            onChange={(event) => setFavoriteQuery(event.target.value)}
            placeholder={t("aiCfo.searchFavorites")}
            type="search"
            value={favoriteQuery}
          />
          {notice ? (
            <p className="ai-cfo-favorite-notice" role="status">
              ✓ {notice}
            </p>
          ) : null}
          {visibleFavorites.length === 0 ? (
            <p className="ai-cfo-favorite-empty">{favoriteQuery.trim() ? t("aiCfo.favoriteNoMatches") : t("aiCfo.noFavorites")}</p>
          ) : (
            <ul>
              {visibleFavorites.map((favorite) => (
                <li key={favorite.id}>
                  <button className="ai-cfo-favorite-run" disabled={pending} onClick={() => void runFavorite(favorite)} type="button">
                    <span aria-hidden="true">⭐</span>
                    <strong>{favorite.title}</strong>
                    <span>{favorite.question}</span>
                  </button>
                  <div className="ai-cfo-favorite-actions">
                    <button className="button button-outline button-small" disabled={pending} onClick={() => void runFavorite(favorite)} type="button">
                      {t("aiCfo.runQuestion")}
                    </button>
                    <button
                      aria-expanded={menuId === favorite.id}
                      aria-haspopup="menu"
                      aria-label={t("aiCfo.moreActions")}
                      className="button button-outline button-small"
                      onClick={() => setMenuId((current) => (current === favorite.id ? null : favorite.id))}
                      type="button"
                    >
                      •••
                    </button>
                    {menuId === favorite.id ? (
                      <div className="ai-cfo-favorite-menu" role="menu">
                        <button onClick={() => void runFavorite(favorite)} role="menuitem" type="button">
                          {t("aiCfo.runQuestion")}
                        </button>
                        <button onClick={() => openEdit(favorite)} role="menuitem" type="button">
                          {t("aiCfo.editQuestion")}
                        </button>
                        <button onClick={() => void removeFavorite(favorite.id)} role="menuitem" type="button">
                          {t("aiCfo.removeFromFavorites")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="ai-cfo-main">
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
                void chooseProjects(
                  [projectId],
                  pendingQuestion ?? undefined,
                  pendingQuestion ? pendingFavoriteId ?? undefined : undefined,
                );
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

          {messages.map((message) => {
            const saved = message.role === "user" ? favoriteForQuestion(message.content) : null;

            return (
              <article className={`ai-cfo-message ai-cfo-message-${message.role}`} key={message.id}>
                <p className="ai-cfo-author">{message.role === "user" ? t("aiCfo.you") : t("aiCfo.title")}</p>
                {message.favoriteProjectName ? (
                  <p className="ai-cfo-source">{t("aiCfo.favoriteProject", { name: message.favoriteProjectName })}</p>
                ) : null}
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
                    onApply={(ids) => chooseProjects(ids, message.originalQuestion, message.favoriteId)}
                    onSelect={(projectId) => chooseProjects([projectId], message.originalQuestion, message.favoriteId)}
                    projects={message.projects}
                    selectLabel={t("aiCfo.select")}
                  />
                ) : null}
                {message.role === "user" ? (
                  <div className="ai-cfo-message-tools">
                    <button
                      aria-label={saved ? t("aiCfo.removeFromFavorites") : t("aiCfo.addToFavorites")}
                      aria-pressed={Boolean(saved)}
                      className="ai-cfo-favorite-star"
                      onClick={() => {
                        if (saved) {
                          void removeFavorite(saved.id);
                          return;
                        }

                        openCreate(message.content);
                      }}
                      type="button"
                    >
                      {saved ? `★ ${t("aiCfo.removeFromFavorites")}` : `☆ ${t("aiCfo.addToFavorites")}`}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}

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
      </div>

      {editor ? (
        <div className="ai-cfo-dialog" role="presentation">
          <form
            aria-labelledby="ai-cfo-favorite-dialog-title"
            className="ai-cfo-dialog-card"
            onSubmit={(event) => {
              event.preventDefault();
              void saveEditor();
            }}
            role="dialog"
          >
            <h2 id="ai-cfo-favorite-dialog-title">{editor.mode === "edit" ? t("aiCfo.editQuestion") : t("aiCfo.saveFavorite")}</h2>
            <label>
              {t("aiCfo.favoriteTitle")}
              <input
                maxLength={120}
                onChange={(event) => setEditor({ ...editor, title: event.target.value })}
                required
                value={editor.title}
              />
            </label>
            <label>
              {t("aiCfo.favoriteQuestion")}
              <textarea
                maxLength={2000}
                onChange={(event) => setEditor({ ...editor, question: event.target.value })}
                required
                rows={4}
                value={editor.question}
              />
            </label>
            {editorError ? (
              <p className="form-error" role="alert">
                {editorError}
              </p>
            ) : null}
            <div className="ai-cfo-dialog-actions">
              <button className="button button-outline button-small" onClick={() => setEditor(null)} type="button">
                {t("common.cancel")}
              </button>
              <button className="button button-small" disabled={editorPending || editor.title.trim().length === 0 || editor.question.trim().length === 0} type="submit">
                {t("common.save")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
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
