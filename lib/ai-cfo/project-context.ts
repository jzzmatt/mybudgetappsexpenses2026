import { matchNamedRecords, normalizeSearchText } from "@/lib/ai-cfo/match";

export type CfoProject = {
  id: string;
  name: string;
  description?: string | null;
};

export type ProjectContextDecision =
  | {
      state: "selected";
      queryProjects: CfoProject[];
      explicitOverride: boolean;
    }
  | { state: "required"; allowMultiple: boolean }
  | { state: "invalid"; requestedName: string }
  | { state: "ambiguous"; projects: CfoProject[]; requestedName: string };

const COMPARE_PATTERN = /\b(compare|comparison|comparar|compara|comparer)\b/i;

export function canRunFinancialTools(decision: ProjectContextDecision) {
  return decision.state === "selected" && decision.queryProjects.length > 0;
}

export function projectAccessDecision(ownerUserId: string | null | undefined, sessionUserId: string) {
  if (!ownerUserId || ownerUserId !== sessionUserId) {
    return "denied" as const;
  }

  return "allowed" as const;
}

export function bindAuthorizedProjects(authorizedProjectIds: string[], requestedProjectId?: string) {
  const rejectedUnscopedProject = Boolean(requestedProjectId && !authorizedProjectIds.includes(requestedProjectId));

  return {
    projectIds: authorizedProjectIds,
    rejectedUnscopedProject,
  };
}

export function resolveProjectContext(input: {
  message: string;
  projects: CfoProject[];
  activeProjectId?: string | null;
}): ProjectContextDecision {
  const active = input.projects.find((project) => project.id === input.activeProjectId) ?? null;
  const quoted = quotedNames(input.message);

  if (quoted.length > 0) {
    return resolvePhrases(quoted, input.projects, active);
  }

  const contained = uniqueContained(projectsContained(input.message, input.projects));

  if (contained.length > 0) {
    return {
      state: "selected",
      queryProjects: contained,
      explicitOverride: contained.length > 1 || !active || contained[0]?.id !== active.id,
    };
  }

  const phrase = labeledName(input.message) ?? leadingInClause(input.message);

  if (phrase) {
    return resolvePhrases([phrase], input.projects, active);
  }

  if (COMPARE_PATTERN.test(input.message)) {
    return { state: "required", allowMultiple: true };
  }

  if (active) {
    return {
      state: "selected",
      queryProjects: [active],
      explicitOverride: false,
    };
  }

  return { state: "required", allowMultiple: false };
}

function resolvePhrases(phrases: string[], projects: CfoProject[], active: CfoProject | null): ProjectContextDecision {
  const matches = phrases.map((phrase) => ({ phrase, match: matchNamedRecords(projects, phrase) }));
  const ambiguous = matches.find((entry) => entry.match.status === "ambiguous");

  if (ambiguous && ambiguous.match.status === "ambiguous") {
    return {
      state: "ambiguous",
      projects: ambiguous.match.records,
      requestedName: ambiguous.phrase,
    };
  }

  const missing = matches.find((entry) => entry.match.status === "none");

  if (missing) {
    return { state: "invalid", requestedName: missing.phrase };
  }

  const selected = matches.flatMap((entry) => (entry.match.status === "unique" ? [entry.match.record] : []));
  const unique = dedupeProjects(selected);

  return {
    state: "selected",
    queryProjects: unique,
    explicitOverride: unique.length > 1 || !active || unique[0]?.id !== active.id,
  };
}

function quotedNames(message: string) {
  return [...message.matchAll(/["“”']([^"“”']{2,160})["“”']/g)]
    .map((match) => match[1]?.trim() ?? "")
    .filter((value) => value.length > 1);
}

function labeledName(message: string) {
  const match = message.match(/\b(?:project|projeto|projet)\s+["“”']?(.+?)["“”']?(?=\s*(?:,|\?|$))/i);
  return cleanCandidate(match?.[1]);
}

function leadingInClause(message: string) {
  const match = message.match(/(?:^|\s)(?:in|em)\s+([^,\n]{2,160}),/i);
  return cleanCandidate(match?.[1]);
}

function cleanCandidate(value: string | undefined) {
  const cleaned = value?.replace(/^["“”']|["“”']$/g, "").trim();
  return cleaned && cleaned.length > 1 ? cleaned : null;
}

function projectsContained(message: string, projects: CfoProject[]) {
  const haystack = normalizeSearchText(message);

  return [...projects]
    .sort((left, right) => right.name.length - left.name.length)
    .filter((project) => {
      const name = normalizeSearchText(project.name);
      return name.length >= 3 && haystack.includes(name);
    });
}

function uniqueContained(projects: CfoProject[]) {
  const kept: CfoProject[] = [];

  for (const project of projects) {
    const name = normalizeSearchText(project.name);
    const coveredByLongerName = kept.some((other) => normalizeSearchText(other.name).includes(name));

    if (!coveredByLongerName) {
      kept.push(project);
    }
  }

  return kept;
}

function dedupeProjects(projects: CfoProject[]) {
  const seen = new Set<string>();
  return projects.filter((project) => {
    if (seen.has(project.id)) {
      return false;
    }

    seen.add(project.id);
    return true;
  });
}
