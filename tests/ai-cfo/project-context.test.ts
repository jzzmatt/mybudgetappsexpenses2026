import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bindAuthorizedProjects,
  canRunFinancialTools,
  projectAccessDecision,
  resolveProjectContext,
  type CfoProject,
} from "@/lib/ai-cfo/project-context";

const august: CfoProject = { id: "august", name: "Expenses Agosto 2026", description: "August 2026 expenses" };
const september: CfoProject = { id: "september", name: "Expenses Setembro 2026", description: "September 2026 expenses" };
const septemberFamily: CfoProject = { id: "sept-family", name: "Expenses September Family" };
const september2025: CfoProject = { id: "sept-2025", name: "Expenses September 2025" };
const september2026: CfoProject = { id: "sept-2026", name: "Expenses September 2026" };
const projects = [august, september, septemberFamily, september2025, september2026];

describe("AI CFO project context", () => {
  it("requires a project before any financial query when none is active", () => {
    const decision = resolveProjectContext({
      message: "How much did I spend on Casa Benfica?",
      projects,
    });

    assert.equal(decision.state, "required");
    assert.equal(canRunFinancialTools(decision), false);
  });

  it("resolves an explicit valid project and authorizes that query", () => {
    const decision = resolveProjectContext({
      message: "In Expenses Agosto 2026, how much did I spend on Casa Benfica?",
      projects,
    });

    assert.equal(decision.state, "selected");
    if (decision.state !== "selected") {
      return;
    }

    assert.equal(decision.queryProjects[0]?.id, "august");
    assert.equal(canRunFinancialTools(decision), true);
    assert.equal(projectAccessDecision("user-a", "user-a"), "allowed");
  });

  it("does not query finances when the named project does not exist", () => {
    const decision = resolveProjectContext({
      message: 'In "Expenses December 2030", how much did I spend?',
      projects,
    });

    assert.equal(decision.state, "invalid");
    if (decision.state === "invalid") {
      assert.equal(decision.requestedName, "Expenses December 2030");
    }
    assert.equal(canRunFinancialTools(decision), false);
  });

  it("asks the user to choose when several projects match", () => {
    const decision = resolveProjectContext({
      message: "In Expenses September, how much did I spend?",
      projects,
    });

    assert.equal(decision.state, "ambiguous");
    if (decision.state === "ambiguous") {
      assert.equal(decision.projects.length, 3);
    }
    assert.equal(canRunFinancialTools(decision), false);
  });

  it("reuses the active project for the next question", () => {
    const decision = resolveProjectContext({
      message: "How much did I spend on electricity?",
      projects,
      activeProjectId: august.id,
    });

    assert.equal(decision.state, "selected");
    if (decision.state !== "selected") {
      return;
    }

    assert.deepEqual(decision.queryProjects.map((project) => project.id), ["august"]);
    assert.equal(decision.explicitOverride, false);
  });

  it("uses an explicit project for this question without replacing the active project flag", () => {
    const decision = resolveProjectContext({
      message: "In Expenses Setembro 2026, was Cartão Lombongo paid?",
      projects,
      activeProjectId: august.id,
    });

    assert.equal(decision.state, "selected");
    if (decision.state !== "selected") {
      return;
    }

    assert.equal(decision.queryProjects[0]?.id, "september");
    assert.equal(decision.explicitOverride, true);
  });

  it("denies another user's project without treating a missing project differently", () => {
    assert.equal(projectAccessDecision("user-b", "user-a"), "denied");
    assert.equal(projectAccessDecision(null, "user-a"), "denied");

    const bound = bindAuthorizedProjects(["august"], "someone-elses-project");
    assert.equal(bound.rejectedUnscopedProject, true);
    assert.deepEqual(bound.projectIds, ["august"]);
  });
});
