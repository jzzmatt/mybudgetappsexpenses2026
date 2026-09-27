import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeAmounts } from "@/lib/ai-cfo/aggregate";
import { chatRequestSchema } from "@/lib/ai-cfo/schemas";
import {
  canAddFavorite,
  favoriteAccess,
  favoriteExecutionInput,
  findDuplicateFavorite,
  normalizeFavoriteQuestion,
  resolveFavoriteProject,
  sortFavorites,
  suggestFavoriteTitle,
  type FavoriteQuestion,
} from "@/lib/ai-cfo/favorites";

const question = "How much did I spend on Casa Benfica this month?";

describe("AI CFO favorite questions", () => {
  it("saves the question without an answer", () => {
    const favorite = makeFavorite(question);
    const execution = favoriteExecutionInput(favorite);

    assert.equal(execution.message, question);
    assert.equal(execution.storesAnswer, false);
    assert.equal("lastAnswer" in favorite, false);
    assert.equal(suggestFavoriteTitle("How much did I spend on Casa Benfica in August 2026?"), "Casa Benfica — August 2026");
    assert.equal(suggestFavoriteTitle("Show me all unpaid expenses"), "Unpaid Expenses");
    assert.equal(suggestFavoriteTitle("Was Cartão Lombongo paid in September?"), "Cartão Lombongo — Payment Status");
  });

  it("lists and sorts only by usage time for the current user", () => {
    const older = makeFavorite("Show me all unpaid expenses", { lastUsedAt: "2026-09-01T00:00:00.000Z" });
    const newer = makeFavorite(question, { lastUsedAt: "2026-09-20T00:00:00.000Z" });
    const unused = makeFavorite("Was Cartão Lombongo paid in September?", { lastUsedAt: null, createdAt: "2026-09-27T00:00:00.000Z" });

    assert.deepEqual(sortFavorites([older, unused, newer]).map((item) => item.id), [newer.id, older.id, unused.id]);
  });

  it("runs the saved question against the current rows, not a stored total", () => {
    const favorite = makeFavorite(question);
    const september = summarizeAmounts([row(500000)], "paid");
    const october = summarizeAmounts([row(250000), row(450000)], "paid");

    assert.equal(favoriteExecutionInput(favorite).message, question);
    assert.equal(september[0]?.total, 500000);
    assert.equal(october[0]?.total, 700000);
    assert.notEqual(october[0]?.total, september[0]?.total);
  });

  it("requires a project when a favorite has no active project", () => {
    const decision = resolveFavoriteProject({
      question,
      projects: [{ id: "september", name: "Expenses Setembro 2026" }],
    });

    assert.equal(decision.state, "required");
  });

  it("uses the active project when the favorite does not name one", () => {
    const decision = resolveFavoriteProject({
      question,
      projects: [
        { id: "september", name: "Expenses Setembro 2026" },
        { id: "august", name: "Expenses Agosto 2026" },
      ],
      activeProjectId: "september",
    });

    assert.equal(decision.state, "selected");
    if (decision.state === "selected") {
      assert.equal(decision.queryProjects[0]?.id, "september");
      assert.equal(decision.explicitOverride, false);
    }
  });

  it("lets an explicit project in the favorite override the active project", () => {
    const decision = resolveFavoriteProject({
      question: "In Expenses Agosto 2026, how much did I spend on Casa Benfica?",
      projects: [
        { id: "september", name: "Expenses Setembro 2026" },
        { id: "august", name: "Expenses Agosto 2026" },
      ],
      activeProjectId: "september",
    });

    assert.equal(decision.state, "selected");
    if (decision.state === "selected") {
      assert.equal(decision.queryProjects[0]?.id, "august");
      assert.equal(decision.explicitOverride, true);
    }
  });

  it("hides another user's favorite the same way as a missing one", () => {
    assert.equal(favoriteAccess({ userId: "user-b" }, "user-a"), "not_found");
    assert.equal(favoriteAccess(null, "user-a"), "not_found");
    assert.equal(favoriteAccess({ userId: "user-a" }, "user-a"), "allowed");
  });

  it("prevents an exact duplicate and enforces the limit", () => {
    const saved = makeFavorite(`  HOW   much did I spend on Casa Benfica this month?  `);
    assert.ok(findDuplicateFavorite([saved], question));
    assert.equal(normalizeFavoriteQuestion(question), normalizeFavoriteQuestion(saved.question));
    assert.equal(canAddFavorite(20, 20), false);
    assert.equal(canAddFavorite(19, 20), true);
  });

  it("keeps favoriteId on the normal chat request", () => {
    const favoriteId = "11111111-1111-4111-8111-111111111111";
    const parsed = chatRequestSchema.parse({
      intent: "ask",
      message: question,
      favoriteId,
    });

    assert.equal(parsed.favoriteId, favoriteId);
    assert.equal(parsed.message, question);
  });

  it("removes a favorite from the current user's list", () => {
    const first = makeFavorite(question);
    const second = makeFavorite("Show me all unpaid expenses");
    const remaining = [first, second].filter((favorite) => favorite.id !== first.id);

    assert.deepEqual(remaining.map((favorite) => favorite.question), ["Show me all unpaid expenses"]);
  });
});

function makeFavorite(text: string, overrides: Partial<FavoriteQuestion> = {}): FavoriteQuestion {
  return {
    id: overrides.id ?? text.slice(0, 12),
    userId: "user-a",
    title: overrides.title ?? "Favorite",
    question: text,
    createdAt: overrides.createdAt ?? "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    lastUsedAt: overrides.lastUsedAt === undefined ? null : overrides.lastUsedAt,
    usageCount: overrides.usageCount ?? 0,
  };
}

function row(paidAmount: number) {
  return {
    date: "2026-09-10",
    currency: "AOA",
    paidAmount,
    budgetAmount: paidAmount,
    status: "paid",
  };
}
