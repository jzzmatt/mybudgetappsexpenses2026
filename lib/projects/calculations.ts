import { DEFAULT_EXPENSE_CURRENCY, type ExpenseCurrency } from "@/lib/currency/types";
import type { Expense, ExpenseDerivedMetrics, ExpenseWithRelations } from "@/lib/expenses/types";
import type { Project, ProjectFinancialSummary } from "@/lib/projects/types";

/**
 * Calculates derived metrics for an individual expense relative to its budget and project budget.
 *
 * Formulas (per PRODUCT_MODEL.md):
 * - remaining = budget_amount - paid_amount
 * - expense_paid_percent = paid_amount / budget_amount * 100
 * - project_budget_impact_percent = paid_amount / project.budget_amount * 100
 */
export function calculateExpenseMetrics(
  expense: Pick<Expense, "budget_amount" | "paid_amount">,
  projectBudgetAmount?: number,
): ExpenseDerivedMetrics {
  const budget = Number(expense.budget_amount) || 0;
  const paid = Number(expense.paid_amount) || 0;
  const remaining = budget - paid;

  const expensePaidPercent = budget > 0 ? (paid / budget) * 100 : 0;
  const projectBudget = Number(projectBudgetAmount) || 0;
  const projectBudgetImpactPercent = projectBudget > 0 ? (paid / projectBudget) * 100 : 0;

  return {
    remaining,
    expensePaidPercent: Number.isFinite(expensePaidPercent) ? expensePaidPercent : 0,
    projectBudgetImpactPercent: Number.isFinite(projectBudgetImpactPercent)
      ? projectBudgetImpactPercent
      : 0,
  };
}

/**
 * Attaches calculated metrics to an expense object.
 */
export function enrichExpenseWithMetrics<T extends ExpenseWithRelations | Expense>(
  expense: T,
  projectBudgetAmount?: number,
): T & { derived: ExpenseDerivedMetrics } {
  const derived = calculateExpenseMetrics(expense, projectBudgetAmount);
  return {
    ...expense,
    derived,
  };
}

/**
 * Computes deterministic financial workspace calculations for a project and its expenses.
 *
 * Formulas (per PRODUCT_MODEL.md):
 * - Project Budget = project.budget_amount
 * - Total Expense Budget = SUM(expenses.budget_amount)
 * - Total Paid = SUM(expenses.paid_amount)
 * - Total Expense Remaining = SUM(budget_amount - paid_amount)
 * - Available Budget = Project Budget - Total Expense Budget
 * - Project Paid % = Total Paid / Project Budget * 100
 * - Allocated % = Total Expense Budget / Project Budget * 100
 * - Overspending: Total Expense Budget > Project Budget
 */
export function calculateProjectFinancialSummary(
  project: Pick<Project, "budget_amount" | "currency"> | { budget_amount?: number; currency?: ExpenseCurrency },
  expenses: Array<Pick<Expense, "budget_amount" | "paid_amount">>,
): ProjectFinancialSummary {
  const projectBudget = Number(project?.budget_amount) || 0;
  const currency = project?.currency || DEFAULT_EXPENSE_CURRENCY;

  let totalExpenseBudget = 0;
  let totalPaid = 0;
  let totalExpenseRemaining = 0;

  for (const exp of expenses) {
    const b = Number(exp.budget_amount) || 0;
    const p = Number(exp.paid_amount) || 0;
    totalExpenseBudget += b;
    totalPaid += p;
    totalExpenseRemaining += b - p;
  }

  const availableBudget = projectBudget - totalExpenseBudget;
  const projectPaidPercent = projectBudget > 0 ? (totalPaid / projectBudget) * 100 : 0;
  const allocatedPercent = projectBudget > 0 ? (totalExpenseBudget / projectBudget) * 100 : 0;
  const isOverspent = totalExpenseBudget > projectBudget;

  return {
    projectBudget,
    totalExpenseBudget,
    totalPaid,
    totalExpenseRemaining,
    availableBudget,
    projectPaidPercent: Number.isFinite(projectPaidPercent) ? projectPaidPercent : 0,
    allocatedPercent: Number.isFinite(allocatedPercent) ? allocatedPercent : 0,
    isOverspent,
    expenseCount: expenses.length,
    currency,
  };
}

/**
 * Helper to check if adding/updating an expense will cause project allocation to exceed project budget.
 * Used to trigger a confirmation warning before creating/updating an expense.
 */
export function willCauseProjectOverspending(
  projectBudget: number,
  currentTotalExpenseBudget: number,
  newExpenseBudgetAmount: number,
  oldExpenseBudgetAmount = 0,
): { isOverspent: boolean; excessAmount: number; newTotalExpenseBudget: number } {
  const newTotalExpenseBudget =
    currentTotalExpenseBudget - oldExpenseBudgetAmount + newExpenseBudgetAmount;
  const excessAmount = Math.max(0, newTotalExpenseBudget - projectBudget);

  return {
    isOverspent: newTotalExpenseBudget > projectBudget,
    excessAmount,
    newTotalExpenseBudget,
  };
}
