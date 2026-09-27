import { NextResponse } from "next/server";
import { deleteFavorite, updateFavorite } from "@/lib/ai-cfo/favorite-repository";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  question: z.string().trim().min(1).max(2000),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireUser() {
  try {
    return await ensureUserRecord();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await requireUser();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await updateFavorite(userId, id, parsed.data);

    if ("error" in result) {
      const status = result.error === "duplicate" ? 409 : 404;
      return NextResponse.json({ error: result.error === "duplicate" ? "duplicate" : "not_found" }, { status });
    }

    return NextResponse.json({
      favorite: {
        id: result.favorite.id,
        title: result.favorite.title,
        question: result.favorite.question,
        createdAt: result.favorite.createdAt,
        updatedAt: result.favorite.updatedAt,
        lastUsedAt: result.favorite.lastUsedAt,
        usageCount: result.favorite.usageCount,
      },
    });
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await requireUser();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteFavorite(userId, id);

    if (!deleted) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
