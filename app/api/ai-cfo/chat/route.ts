import { NextResponse } from "next/server";
import { saveConversationTurn, loadConversation } from "@/lib/ai-cfo/history";
import { consumeAiCfoRateLimit } from "@/lib/ai-cfo/rate-limit";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { AiCfoOpenAiError, runAiCfoChat } from "@/lib/ai-cfo/run-chat";
import { chatRequestSchema } from "@/lib/ai-cfo/schemas";
import { getLocale } from "@/lib/i18n/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";

function rateLimit() {
  const parsed = Number(process.env.AI_CFO_RATE_LIMIT ?? "30");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
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

  const locale = await getLocale();
  const history = parsed.data.conversationId
    ? await loadConversation(userId, parsed.data.conversationId)
    : null;

  if (parsed.data.conversationId && !history) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const result = await runAiCfoChat({
      userId,
      locale,
      message: parsed.data.message,
      history: history?.messages ?? [],
    });

    const conversationId = await saveConversationTurn({
      userId,
      conversationId: history?.id,
      userMessage: parsed.data.message,
      assistantMessage: result.reply,
    });

    return NextResponse.json({
      reply: result.reply,
      conversationId,
      evidence: result.evidence,
      source: result.source,
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
