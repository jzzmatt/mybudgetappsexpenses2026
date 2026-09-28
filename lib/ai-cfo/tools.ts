import "server-only";

import { summarizeAmounts, summarizeByMonth } from "@/lib/ai-cfo/aggregate";
import { AI_CFO_DEFAULT_TIMEZONE, resolveDateRange, type DateRangeInput } from "@/lib/ai-cfo/dates";
import { foreignUserAttempt } from "@/lib/ai-cfo/guard";
import { matchNamedRecords, matchesExpenseText } from "@/lib/ai-cfo/match";
import {
  getUserExpense,
  listUserCategories,
  listUserExpenses,
  listUserProjects,
  sourceFromExpenses,
  toEvidence,
  type AiCfoExpenseRecord,
  type AiCfoNamedRecord,
} from "@/lib/ai-cfo/repository";
import { getScopedPayment, listScopedPayments } from "@/lib/ai-cfo/payments";
import { bindAuthorizedProjects } from "@/lib/ai-cfo/project-context";
import { toolArgsSchema, type ToolArgs } from "@/lib/ai-cfo/schemas";
import type { AiCfoEvidenceExpense, AiCfoSource } from "@/lib/ai-cfo/types";

const TOTAL_LIMIT = 2000;
const EVIDENCE_LIMIT = 20;

export const AI_CFO_TOOL_NAMES = [
  "search_categories",
  "get_category",
  "search_projects",
  "get_project",
  "list_user_projects",
  "resolve_user_project",
  "search_expenses",
  "get_expense",
  "get_expenses_by_category",
  "get_expenses_by_project",
  "get_expenses_by_period",
  "get_payment_status",
  "calculate_expense_total",
  "calculate_category_total",
  "calculate_project_total",
  "get_monthly_summary",
  "get_budget_summary",
  "get_budget_vs_actual",
  "get_unpaid_expenses",
  "search_payments",
  "get_payment_expenses",
] as const;

export type AiCfoToolName = (typeof AI_CFO_TOOL_NAMES)[number];

const PROJECT_SCOPED_TOOLS = new Set<AiCfoToolName>([
  "search_expenses",
  "get_expense",
  "get_expenses_by_category",
  "get_expenses_by_project",
  "get_expenses_by_period",
  "get_payment_status",
  "calculate_expense_total",
  "calculate_category_total",
  "calculate_project_total",
  "get_monthly_summary",
  "get_budget_summary",
  "get_budget_vs_actual",
  "get_unpaid_expenses",
  "search_payments",
  "get_payment_expenses",
]);

export type AiCfoToolContext = {
  projectIds: string[];
};

type ToolPayload = {
  success: boolean;
  evidence?: AiCfoEvidenceExpense[];
  source?: AiCfoSource;
  [key: string]: unknown;
};

function dateFilters(args: ToolArgs, now: Date, timeZone: string) {
  const resolved = resolveDateRange(args.dateRange as DateRangeInput | undefined, now, timeZone);

  if (!resolved.ok) {
    return { error: resolved.reason } as const;
  }

  if (resolved.unbounded) {
    return { startDate: undefined, endDate: undefined, label: null } as const;
  }

  return { startDate: resolved.startDate, endDate: resolved.endDate, label: resolved.label } as const;
}

function namedPayload(record: AiCfoNamedRecord) {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    status: record.status ?? null,
    budgetAmount: record.budgetAmount ?? null,
    currency: record.currency ?? null,
  };
}

async function resolveCategory(userId: string, args: ToolArgs) {
  const categories = await listUserCategories(userId);

  if (args.categoryId) {
    const record = categories.find((category) => category.id === args.categoryId) ?? null;
    return record ? { status: "unique" as const, record, categories } : { status: "none" as const, categories };
  }

  if (!args.categoryName && !args.query) {
    return { status: "list" as const, categories };
  }

  const match = matchNamedRecords(categories, args.categoryName ?? args.query ?? "");
  return { ...match, categories };
}

async function resolveProject(userId: string, args: ToolArgs) {
  const projects = await listUserProjects(userId);

  if (args.projectId) {
    const record = projects.find((project) => project.id === args.projectId) ?? null;
    return record ? { status: "unique" as const, record, projects } : { status: "none" as const, projects };
  }

  if (!args.projectName && !args.query) {
    return { status: "list" as const, projects };
  }

  const match = matchNamedRecords(projects, args.projectName ?? args.query ?? "");
  return { ...match, projects };
}

function amountRows(expenses: AiCfoExpenseRecord[]) {
  return expenses.map((expense) => ({
    date: expense.date,
    currency: expense.currency,
    paidAmount: expense.paidAmount,
    budgetAmount: expense.budgetAmount,
    status: expense.status,
  }));
}

function withEvidence(expenses: AiCfoExpenseRecord[], periodLabel: string | null, extra: Record<string, unknown>): ToolPayload {
  return {
    success: true,
    ...extra,
    evidence: expenses.slice(0, EVIDENCE_LIMIT).map(toEvidence),
    source: sourceFromExpenses(expenses, periodLabel),
    truncated: expenses.length > EVIDENCE_LIMIT,
  };
}

export async function executeAiCfoTool(
  userId: string,
  name: string,
  rawArgs: unknown,
  context: AiCfoToolContext = { projectIds: [] },
  now = new Date(),
  timeZone = process.env.AI_CFO_TIMEZONE || AI_CFO_DEFAULT_TIMEZONE,
): Promise<ToolPayload> {
  if (foreignUserAttempt(userId, rawArgs)) {
    return { success: false, error: "access_denied" };
  }

  const parsed = toolArgsSchema.safeParse(rawArgs ?? {});

  if (!parsed.success) {
    return { success: false, error: "invalid_arguments" };
  }

  const args = parsed.data;
  const scope = bindAuthorizedProjects(context.projectIds, args.projectId);

  if (PROJECT_SCOPED_TOOLS.has(name as AiCfoToolName) && scope.rejectedUnscopedProject) {
    return { success: false, error: "access_denied" };
  }

  if (PROJECT_SCOPED_TOOLS.has(name as AiCfoToolName) && scope.projectIds.length === 0) {
    return { success: false, error: "project_required" };
  }

  const dates = dateFilters(args, now, timeZone);

  if ("error" in dates) {
    return {
      success: false,
      error: dates.error,
      message:
        dates.error === "year_required"
          ? "The period is missing a year. Ask the user which year they mean."
          : "The date range is invalid.",
    };
  }

  switch (name) {
    case "search_categories":
    case "get_category": {
      const resolved = await resolveCategory(userId, args);
      if (resolved.status === "list") {
        return { success: true, categories: resolved.categories.map(namedPayload) };
      }
      if (resolved.status === "none") {
        return { success: true, matched: false, status: "not_found" };
      }
      if (resolved.status === "ambiguous") {
        return { success: true, ambiguous: true, matches: resolved.records.map(namedPayload) };
      }
      return { success: true, matched: true, category: namedPayload(resolved.record) };
    }
    case "list_user_projects":
    case "resolve_user_project":
    case "search_projects":
    case "get_project": {
      const resolved = await resolveProject(
        userId,
        name === "list_user_projects" ? { ...args, projectName: undefined } : args,
      );
      if (name === "resolve_user_project") {
        if (resolved.status === "unique") {
          return { success: true, status: "exact_match", project: namedPayload(resolved.record) };
        }
        if (resolved.status === "ambiguous") {
          return { success: true, status: "multiple_matches", projects: resolved.records.map(namedPayload) };
        }
        return { success: true, status: "no_match", projects: [] };
      }
      if (name === "list_user_projects") {
        if (resolved.status === "list") {
          return { success: true, projects: resolved.projects.map(namedPayload) };
        }
        if (resolved.status === "unique") {
          return { success: true, projects: [namedPayload(resolved.record)] };
        }
        if (resolved.status === "ambiguous") {
          return { success: true, projects: resolved.records.map(namedPayload) };
        }
        return { success: true, projects: [] };
      }
      if (resolved.status === "list") {
        return { success: true, projects: resolved.projects.map(namedPayload) };
      }
      if (resolved.status === "none") {
        return { success: true, matched: false, status: "not_found" };
      }
      if (resolved.status === "ambiguous") {
        return { success: true, ambiguous: true, matches: resolved.records.map(namedPayload) };
      }
      return { success: true, matched: true, project: namedPayload(resolved.record) };
    }
    case "search_payments": {
      const payments = await listScopedPayments(userId, scope.projectIds, dates.startDate, dates.endDate);
      return {
        success: true,
        matched: payments.length > 0,
        status: payments.length === 0 ? "not_found" : "found",
        payments: payments.map((payment) => ({
          ...payment,
          expenses: payment.expenses.slice(0, EVIDENCE_LIMIT),
          truncated: payment.expenses.length > EVIDENCE_LIMIT,
        })),
      };
    }
    case "get_payment_expenses": {
      if (!args.paymentId) {
        return { success: false, error: "invalid_arguments" };
      }
      const payment = await getScopedPayment(userId, args.paymentId, scope.projectIds);
      if (!payment) {
        return { success: true, matched: false, status: "not_found" };
      }
      return { success: true, matched: true, payment };
    }
    case "get_expense": {
      if (!args.expenseId) {
        return { success: false, error: "invalid_arguments" };
      }
      const expense = await getUserExpense(userId, args.expenseId);
      if (!expense || !scope.projectIds.includes(expense.projectId ?? "")) {
        return { success: true, matched: false, status: "not_found" };
      }
      return withEvidence([expense], null, { matched: true, expense: toEvidence(expense) });
    }
    case "search_expenses":
    case "get_expenses_by_period":
    case "get_expenses_by_category":
    case "get_expenses_by_project":
    case "get_payment_status":
    case "calculate_expense_total":
    case "calculate_category_total":
    case "calculate_project_total":
    case "get_monthly_summary":
    case "get_unpaid_expenses":
      return executeExpenseTool(userId, name, args, dates, scope.projectIds);
    case "get_budget_summary":
    case "get_budget_vs_actual":
      return executeBudgetTool(userId, name, args, dates, scope.projectIds);
    default:
      return { success: false, error: "unknown_tool" };
  }
}

async function executeExpenseTool(
  userId: string,
  name: string,
  args: ToolArgs,
  dates: { startDate?: string; endDate?: string; label: string | null },
  projectIds: string[],
): Promise<ToolPayload> {
  let categoryId = args.categoryId;

  if (name === "calculate_category_total" || name === "get_expenses_by_category" || args.categoryName) {
    const resolved = await resolveCategory(userId, args);
    if (resolved.status === "ambiguous") {
      return { success: true, ambiguous: true, matches: resolved.records.map(namedPayload) };
    }
    if (resolved.status !== "unique") {
      return { success: true, matched: false, status: "not_found" };
    }
    categoryId = resolved.record.id;
  }

  const needsText = name === "search_expenses" || name === "get_payment_status";
  const queryText = args.query ?? args.categoryName;

  if (needsText && !queryText && !categoryId) {
    return { success: false, error: "narrow_the_query" };
  }

  const expenses = await listUserExpenses(userId, {
    startDate: dates.startDate,
    endDate: dates.endDate,
    categoryId,
    projectIds,
    status: name === "get_unpaid_expenses" ? undefined : args.status,
    statuses: name === "get_unpaid_expenses" ? ["pending", "partial"] : undefined,
    limit: name.startsWith("calculate_") || name === "get_monthly_summary" ? TOTAL_LIMIT : (args.limit ?? 50),
  });

  const filterByText =
    Boolean(queryText) &&
    (needsText ||
      ((name === "calculate_expense_total" || name === "get_monthly_summary") && !categoryId));
  const filtered = filterByText && queryText ? expenses.filter((expense) => matchesExpenseText(expense, queryText)) : expenses;
  const basis = args.basis ?? "paid";

  if (name === "get_payment_status") {
    return withEvidence(filtered, dates.label, {
      matched: filtered.length > 0,
      status: filtered.length === 0 ? "not_found" : "found",
      matchCount: filtered.length,
      payments: filtered.slice(0, EVIDENCE_LIMIT).map(toEvidence),
    });
  }

  if (name === "calculate_expense_total" || name === "calculate_category_total" || name === "calculate_project_total") {
    const totals = summarizeAmounts(amountRows(filtered), basis);
    return withEvidence(filtered, dates.label, {
      matched: true,
      basis,
      expenseCount: filtered.length,
      totals,
    });
  }

  if (name === "get_monthly_summary") {
    return withEvidence(filtered, dates.label, {
      matched: true,
      basis,
      months: summarizeByMonth(amountRows(filtered), basis),
      totals: summarizeAmounts(amountRows(filtered), basis),
    });
  }

  return withEvidence(filtered, dates.label, {
    matched: filtered.length > 0,
    status: filtered.length === 0 ? "not_found" : "found",
    expenses: filtered.slice(0, EVIDENCE_LIMIT).map(toEvidence),
  });
}

async function executeBudgetTool(
  userId: string,
  name: string,
  _args: ToolArgs,
  dates: { startDate?: string; endDate?: string; label: string | null },
  projectIds: string[],
): Promise<ToolPayload> {
  const owned = await listUserProjects(userId);
  const projects = owned.filter((project) => projectIds.includes(project.id));

  if (name === "get_budget_summary") {
    return {
      success: true,
      projects: projects.map(namedPayload),
    };
  }

  const comparisons = [];

  for (const project of projects) {
    const expenses = await listUserExpenses(userId, {
      projectId: project.id,
      startDate: dates.startDate,
      endDate: dates.endDate,
      limit: TOTAL_LIMIT,
    });
    const actual = summarizeAmounts(amountRows(expenses), "paid");
    const sameCurrency = actual.find((total) => total.currency === project.currency);
    comparisons.push({
      project: namedPayload(project),
      budgetAmount: project.budgetAmount ?? 0,
      budgetCurrency: project.currency,
      actual,
      variance:
        sameCurrency && project.currency
          ? {
              currency: project.currency,
              amount: Math.round(((project.budgetAmount ?? 0) - sameCurrency.total) * 100) / 100,
            }
          : null,
    });
  }

  return { success: true, comparisons, periodLabel: dates.label };
}

export const aiCfoToolDefinitions = AI_CFO_TOOL_NAMES.map((name) => ({
  type: "function" as const,
  function: {
    name,
    description: toolDescription(name),
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", description: "Natural-language name or description to match." },
        categoryId: { type: "string" },
        categoryName: { type: "string" },
        projectId: { type: "string" },
        projectName: { type: "string" },
        expenseId: { type: "string" },
        paymentId: { type: "string", description: "Payment id returned by search_payments." },
        status: { type: "string", enum: ["pending", "partial", "paid"] },
        basis: { type: "string", enum: ["paid", "budget"] },
        limit: { type: "integer", minimum: 1, maximum: 50 },
        dateRange: {
          type: "object",
          additionalProperties: false,
          properties: {
            preset: {
              type: "string",
              enum: [
                "today",
                "yesterday",
                "this_week",
                "last_week",
                "this_month",
                "last_month",
                "this_year",
                "last_year",
                "last_3_months",
                "last_6_months",
              ],
            },
            year: { type: "integer" },
            month: { type: "integer", description: "1-12. Omit year if the user did not specify one." },
            quarter: { type: "integer", enum: [1, 2, 3, 4] },
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" },
          },
        },
      },
    },
  },
}));

function toolDescription(name: AiCfoToolName) {
  switch (name) {
    case "search_categories":
      return "Find the authenticated user's categories by name. Returns not_found or ambiguous instead of guessing.";
    case "get_category":
      return "Read one category that belongs to the authenticated user.";
    case "search_projects":
    case "list_user_projects":
      return "List projects owned by the authenticated user. Optional search narrows the list. Never returns another user's projects.";
    case "resolve_user_project":
      return "Resolve one project name to exact_match, multiple_matches, or no_match for the authenticated user.";
    case "get_project":
      return "Read one project that belongs to the authenticated user, including its budget.";
    case "search_expenses":
      return "Search expenses inside the already authorized project context.";
    case "get_expense":
      return "Read one expense by id. The id must belong to the authenticated user.";
    case "get_expenses_by_category":
      return "List expenses for one resolved category.";
    case "get_expenses_by_project":
      return "List expenses for one resolved project.";
    case "get_expenses_by_period":
      return "List expenses in a resolved date range.";
    case "get_payment_status":
      return "Find matching expenses and return each payment status, paidAt, paymentMethod, hasEvidence, and evidenceCount. Does not choose among multiple matches or return file paths.";
    case "calculate_expense_total":
      return "Deterministic sum of matching expenses. Use basis paid for spending and budget for budgeted amounts.";
    case "calculate_category_total":
      return "Deterministic category total for the authenticated user. Resolves the category first.";
    case "calculate_project_total":
      return "Deterministic project expense total for the authenticated user.";
    case "get_monthly_summary":
      return "Deterministic monthly totals for a period. Use this for last-N-month questions.";
    case "get_budget_summary":
      return "Read project budget amounts stored in BudgetApp. Does not invent budgets.";
    case "get_budget_vs_actual":
      return "Compare each project budget with the deterministic sum of paid expenses in that project.";
    case "get_unpaid_expenses":
      return "List pending and partial expenses for the authenticated user.";
    case "search_payments":
      return "Find payments in the authorized project. Returns each payment total, date, method, expense count, and the included expense descriptions and amounts. Totals include only expenses inside the authorized project.";
    case "get_payment_expenses":
      return "List the expenses included in one payment id, with each description and amount, plus the payment total. Refuses payments outside the authorized project.";
    default:
      return "Read authenticated BudgetApp data.";
  }
}
