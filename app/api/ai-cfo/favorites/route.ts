import { NextResponse } from "next/server";
import { createFavorite, listFavorites } from "@/lib/ai-cfo/favorite-repository";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { suggestFavoriteTitle } from "@/lib/ai-cfo/favorites";
import { getLocale } from "@/lib/i18n/server";
import { ensureUserRecord } from "@/lib/users/ensure-user";
import { z } from "zod";

const favoriteBodySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  question: z.string().trim().min(1).max(2000),
});

async function requireUser() {
  try {
    return await ensureUserRecord();
  } catch {
    return null;
  }
}

function publicFavorite(favorite: Awaited<ReturnType<typeof listFavorites>>[number]) {
  return {
    id: favorite.id,
    title: favorite.title,
    question: favorite.question,
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt,
    lastUsedAt: favorite.lastUsedAt,
    usageCount: favorite.usageCount,
  };
}

export async function GET() {
  const userId = await requireUser();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const favorites = await listFavorites(userId);
    return NextResponse.json({ favorites: favorites.map(publicFavorite) });
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const userId = await requireUser();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = favoriteBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const locale = await getLocale();
  const title = parsed.data.title ?? suggestFavoriteTitle(parsed.data.question, locale);

  try {
    const result = await createFavorite(userId, { title, question: parsed.data.question });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.error === "duplicate" ? 409 : 422 });
    }

    return NextResponse.json({ favorite: publicFavorite(result.favorite) }, { status: 201 });
  } catch (error) {
    if (error instanceof AiCfoDatabaseError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
