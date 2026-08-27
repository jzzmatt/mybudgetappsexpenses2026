import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ptMessages } from "@/lib/i18n/messages/pt";
import { createTranslator } from "@/lib/i18n/translator";
import { isLocale } from "@/lib/i18n/config";

describe("i18n translator", () => {
  it("resolves nested message keys", () => {
    const t = createTranslator(ptMessages);
    assert.equal(t("nav.myProjects"), "Meus Projetos");
  });

  it("interpolates parameters", () => {
    const t = createTranslator(ptMessages);
    assert.equal(
      t("pagination.summary", { page: 1, totalPages: 3, totalCount: 25 }),
      "Página 1 de 3 (25 no total)",
    );
  });

  it("validates locale codes", () => {
    assert.equal(isLocale("pt"), true);
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("fr"), true);
    assert.equal(isLocale("de"), false);
  });
});
