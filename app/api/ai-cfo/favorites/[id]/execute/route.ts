import { NextResponse } from "next/server";
import { POST as askAiCfo } from "@/app/api/ai-cfo/chat/route";
import { getFavoriteForUser } from "@/lib/ai-cfo/favorite-repository";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { z } from "zod";

const executeSchema = z.object({
  conversationId: z.string().uuid().optional(),
  activeProjectId: z.string().uuid().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let userId: string;

  try {
    userId = await ensureUserRecord();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = executeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const favorite = await getFavoriteForUser(userId, id);

    if (!favorite) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return askAiCfo(
      new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent: "ask",
          message: favorite.question,
          conversationId: parsed.data.conversationId,
          activeProjectId: parsed.data.activeProjectId,
          favoriteId: favorite.id,
        }),
      }),
    );
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
