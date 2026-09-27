import { NextResponse } from "next/server";
import { markFavoriteUsed } from "@/lib/ai-cfo/favorite-repository";
import { saveConversationTurn, loadConversation } from "@/lib/ai-cfo/history";
import { resolveProjectContext, type CfoProject } from "@/lib/ai-cfo/project-context";
import { consumeAiCfoRateLimit } from "@/lib/ai-cfo/rate-limit";
import { AiCfoDatabaseError, listUserProjects } from "@/lib/ai-cfo/repository";
import { AiCfoOpenAiError, runAiCfoChat } from "@/lib/ai-cfo/run-chat";
import { chatRequestSchema } from "@/lib/ai-cfo/schemas";
import type { AiCfoProjectRef } from "@/lib/ai-cfo/types";
import { getTranslations } from "@/lib/i18n/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

function rateLimit() {
  const parsed = Number(process.env.AI_CFO_RATE_LIMIT ?? "30");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
}

function toPublicProject(project: { id: string; name: string; description?: string | null }): AiCfoProjectRef {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
  };
}

export async function POST(request: Request) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = consumeAiCfoRateLimit(userId, rateLimit());

  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { t, locale } = await getTranslations();
  const intent = parsed.data.intent ?? "ask";
  const history = parsed.data.conversationId ? await loadConversation(userId, parsed.data.conversationId) : null;

  if (parsed.data.conversationId && !history) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let projects: CfoProject[];

  try {
    projects = (await listUserProjects(userId)).map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
    }));
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }

  const requestedActiveId = parsed.data.activeProjectId ?? history?.activeProjectId ?? null;
  const activeProject = projects.find((project) => project.id === requestedActiveId) ?? null;

  if (intent === "change_project") {
    const project = projects.find((item) => item.id === parsed.data.projectId);

    if (!project) {
      return NextResponse.json({
        type: "project_not_found",
        message: t("aiCfo.selectProjectPrompt"),
        originalQuestion: "",
        projects: projects.map(toPublicProject),
        conversationId: history?.id ?? null,
        projectContext: activeProject ? toPublicProject(activeProject) : null,
      });
    }

    const conversationId = await saveConversationTurn({
      userId,
      conversationId: history?.id,
      userMessage: t("aiCfo.projectChanged", { name: project.name }),
      assistantMessage: t("aiCfo.projectChanged", { name: project.name }),
      activeProjectId: project.id,
      pendingQuestion: null,
    });

    return NextResponse.json({
      type: "answer",
      message: t("aiCfo.projectChanged", { name: project.name }),
      conversationId,
      projectContext: toPublicProject(project),
      queryProject: toPublicProject(project),
      evidence: [],
      source: null,
    });
  }

  if (intent === "select_project") {
    const ids = parsed.data.projectIds ?? (parsed.data.projectId ? [parsed.data.projectId] : []);
    const chosen = ids
      .map((id) => projects.find((project) => project.id === id))
      .filter((project): project is CfoProject => Boolean(project));

    if (chosen.length !== ids.length || chosen.length === 0) {
      return NextResponse.json({
        type: "project_not_found",
        message: t("aiCfo.selectProjectPrompt"),
        originalQuestion: parsed.data.originalQuestion ?? history?.pendingQuestion ?? "",
        projects: projects.map(toPublicProject),
        conversationId: history?.id ?? null,
        projectContext: activeProject ? toPublicProject(activeProject) : null,
        favoriteId: parsed.data.favoriteId ?? null,
      });
    }

    const question = parsed.data.originalQuestion ?? history?.pendingQuestion ?? parsed.data.message;

    if (!question) {
      const conversationId = await saveConversationTurn({
        userId,
        conversationId: history?.id,
        userMessage: t("aiCfo.projectSelected", { name: chosen[0].name }),
        assistantMessage: t("aiCfo.projectSelected", { name: chosen[0].name }),
        activeProjectId: chosen[0].id,
        pendingQuestion: null,
      });

      return NextResponse.json({
        type: "answer",
        message: t("aiCfo.projectSelected", { name: chosen[0].name }),
        conversationId,
        projectContext: toPublicProject(chosen[0]),
        queryProject: toPublicProject(chosen[0]),
        evidence: [],
        source: null,
      });
    }

    return answerQuestion({
      userId,
      locale,
      question,
      historyMessages: history?.messages ?? [],
      conversationId: history?.id,
      queryProjects: chosen,
      activeProject: chosen.length === 1 ? chosen[0] : activeProject,
      clearPending: true,
      favoriteId: parsed.data.favoriteId,
    });
  }

  const message = parsed.data.message ?? "";
  const decision = resolveProjectContext({
    message,
    projects,
    activeProjectId: activeProject?.id ?? null,
  });

  if (decision.state === "required") {
    const prompt = parsed.data.favoriteId ? t("aiCfo.favoriteSelectProject") : t("aiCfo.selectProjectPrompt");
    const conversationId = await saveConversationTurn({
      userId,
      conversationId: history?.id,
      userMessage: message,
      assistantMessage: prompt,
      activeProjectId: activeProject?.id ?? null,
      pendingQuestion: message,
    });

    return NextResponse.json({
      type: "project_selection_required",
      message: prompt,
      originalQuestion: message,
      projects: projects.map(toPublicProject),
      allowMultiple: decision.allowMultiple,
      conversationId,
      projectContext: activeProject ? toPublicProject(activeProject) : null,
      favoriteId: parsed.data.favoriteId ?? null,
    });
  }

  if (decision.state === "invalid") {
    const conversationId = await saveConversationTurn({
      userId,
      conversationId: history?.id,
      userMessage: message,
      assistantMessage: t("aiCfo.projectNotFound", { name: decision.requestedName }),
      activeProjectId: activeProject?.id ?? null,
      pendingQuestion: message,
    });

    return NextResponse.json({
      type: "project_not_found",
      message: t("aiCfo.projectNotFound", { name: decision.requestedName }),
      originalQuestion: message,
      projects: projects.map(toPublicProject),
      conversationId,
      projectContext: activeProject ? toPublicProject(activeProject) : null,
      favoriteId: parsed.data.favoriteId ?? null,
    });
  }

  if (decision.state === "ambiguous") {
    const conversationId = await saveConversationTurn({
      userId,
      conversationId: history?.id,
      userMessage: message,
      assistantMessage: t("aiCfo.projectAmbiguous", { name: decision.requestedName }),
      activeProjectId: activeProject?.id ?? null,
      pendingQuestion: message,
    });

    return NextResponse.json({
      type: "project_selection_ambiguous",
      message: t("aiCfo.projectAmbiguous", { name: decision.requestedName }),
      originalQuestion: message,
      projects: decision.projects.map(toPublicProject),
      conversationId,
      projectContext: activeProject ? toPublicProject(activeProject) : null,
      favoriteId: parsed.data.favoriteId ?? null,
    });
  }

  const nextActive =
    decision.explicitOverride && activeProject
      ? activeProject
      : decision.queryProjects.length === 1
        ? decision.queryProjects[0]
        : activeProject;

  return answerQuestion({
    userId,
    locale,
    question: message,
    historyMessages: history?.messages ?? [],
    conversationId: history?.id,
    queryProjects: decision.queryProjects,
    activeProject: nextActive,
    clearPending: true,
    favoriteId: parsed.data.favoriteId,
  });
}

async function answerQuestion(input: {
  userId: string;
  locale: Awaited<ReturnType<typeof getTranslations>>["locale"];
  question: string;
  historyMessages: { role: "user" | "assistant"; content: string }[];
  conversationId?: string;
  queryProjects: CfoProject[];
  activeProject: CfoProject | null;
  clearPending: boolean;
  favoriteId?: string;
}) {
  try {
    const result = await runAiCfoChat({
      userId: input.userId,
      locale: input.locale,
      message: input.question,
      history: input.historyMessages,
      queryProjects: input.queryProjects.map((project) => ({ id: project.id, name: project.name })),
    });

    if (input.favoriteId) {
      try {
        await markFavoriteUsed(input.userId, input.favoriteId);
      } catch (error) {
        console.error("ai-cfo favorite usage", error instanceof Error ? error.name : "unknown");
      }
    }

    const conversationId = await saveConversationTurn({
      userId: input.userId,
      conversationId: input.conversationId,
      userMessage: input.question,
      assistantMessage: result.reply,
      activeProjectId: input.activeProject?.id ?? null,
      pendingQuestion: input.clearPending ? null : undefined,
    });

    return NextResponse.json({
      type: "answer",
      message: result.reply,
      conversationId,
      projectContext: input.activeProject ? toPublicProject(input.activeProject) : null,
      queryProject: input.queryProjects[0] ? toPublicProject(input.queryProjects[0]) : null,
      evidence: result.evidence,
      source: result.source,
      favoriteId: input.favoriteId ?? null,
    });
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    if (error instanceof AiCfoOpenAiError) {
      return NextResponse.json({ error: "openai_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "openai_unavailable" }, { status: 503 });
  }
}
