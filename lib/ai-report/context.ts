import { getBudgets } from "@/lib/budgets/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import type { AiReportContext, AiReportFilters } from "@/lib/ai-report/types";
import { getAiReportPeriodLabel } from "@/lib/ai-report/params";

export async function buildAiReportContext(filters: AiReportFilters): Promise<AiReportContext> {
  const dashboard = await getDashboardData({
    year: filters.year,
    month: filters.month,
    currency: filters.currency,
  });

  const budgets = await getBudgets({
    year: filters.year,
    month: filters.month ?? undefined,
    currency: filters.currency,
  });

  return {
    period_label: getAiReportPeriodLabel(filters),
    currency: filters.currency,
    kpis: {
      total_budget: dashboard.kpis.totalBudget,
      total_paid: dashboard.kpis.totalPaid,
      remaining_budget: dashboard.kpis.remainingBudget,
      pending_expenses: dashboard.kpis.pendingExpenses,
    },
    category_breakdown: dashboard.categoryData.map((item) => ({
      category: item.category,
      budget: item.budget,
      paid: item.paid,
    })),
    monthly_trend: dashboard.monthlyData.map((item) => ({
      month: item.month,
      budget: item.budget,
      paid: item.paid,
    })),
    budgets: budgets.map((budget) => ({
      name: budget.name,
      category: budget.category?.name ?? null,
      project: budget.project?.name ?? null,
      amount: budget.amount,
      paid: budget.paid_amount,
      remaining: budget.remaining,
      progress_percent: budget.progress_percent,
    })),
  };
}
