export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type NamedRecord = {
  id: string;
  name: string;
};

export type NameMatch<T extends NamedRecord> =
  | { status: "none" }
  | { status: "unique"; record: T }
  | { status: "ambiguous"; records: T[] };

function tokensOf(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function hasWholeToken(name: string, token: string) {
  return name.split(" ").includes(token);
}

export function matchNamedRecords<T extends NamedRecord>(records: T[], query: string): NameMatch<T> {
  const needle = normalizeSearchText(query);
  const tokens = tokensOf(query);

  if (needle.length < 2) {
    return { status: "none" };
  }

  const exact = records.filter((record) => normalizeSearchText(record.name) === needle);

  if (exact.length === 1) {
    return { status: "unique", record: exact[0] };
  }

  if (exact.length > 1) {
    return { status: "ambiguous", records: exact };
  }

  if (tokens.length === 0) {
    return { status: "none" };
  }

  const partial = records.filter((record) => {
    const name = normalizeSearchText(record.name);
    return tokens.every((token) => hasWholeToken(name, token));
  });

  if (partial.length === 1) {
    return { status: "unique", record: partial[0] };
  }

  if (partial.length > 1) {
    return { status: "ambiguous", records: partial };
  }

  return { status: "none" };
}

export type SearchableExpense = {
  id: string;
  description: string;
  categoryName: string | null;
  projectName: string | null;
};

export function matchesExpenseText(expense: SearchableExpense, query: string) {
  const needle = normalizeSearchText(query);
  const tokens = tokensOf(query);

  if (!needle) {
    return false;
  }

  const haystack = normalizeSearchText(
    [expense.description, expense.categoryName, expense.projectName].filter(Boolean).join(" "),
  );

  if (haystack === needle || ` ${haystack} `.includes(` ${needle} `)) {
    return true;
  }

  if (tokens.length === 0) {
    return false;
  }

  const words = haystack.split(" ");

  if (tokens.every((token) => words.includes(token))) {
    return true;
  }

  const descriptionTokens = tokensOf(expense.description);

  return descriptionTokens.length > 0 && descriptionTokens.every((token) => tokens.includes(token));
}
