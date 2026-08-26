import { getProjectReportData } from "@/lib/projects/queries";
import type { ProjectAiReportContext } from "@/lib/ai-report/types";

export async function buildProjectAiReportContext(projectId: string): Promise<ProjectAiReportContext | null> {
  const reportData = await getProjectReportData(projectId);
  if (!reportData) {
    return null;
  }

  const { project, financials, categoryAnalysis, vendorAnalysis, expenses } = reportData;

  // Largest expenses sorted by budget_amount descending
  const sortedExpenses = [...expenses].sort((a, b) => Number(b.budget_amount) - Number(a.budget_amount));
  const largestExpenses = sortedExpenses.slice(0, 5).map((exp) => ({
    description: exp.description,
    budget_amount: Number(exp.budget_amount),
    paid_amount: Number(exp.paid_amount),
    category: exp.category?.name || "Uncategorized",
    status: exp.status,
    priority: exp.priority,
  }));

  // Pending or partial expenses
  const pendingOrPartialExpenses = expenses
    .filter((exp) => exp.status === "pending" || exp.status === "partial")
    .map((exp) => ({
      description: exp.description,
      budget_amount: Number(exp.budget_amount),
      paid_amount: Number(exp.paid_amount),
      remaining: Number(exp.budget_amount) - Number(exp.paid_amount),
      status: exp.status,
      priority: exp.priority,
    }))
    .slice(0, 5);

  return {
    project: {
      id: project.id,
      name: project.name,
      budget_amount: project.budget_amount,
      currency: project.currency,
      status: project.status,
    },
    financials,
    categories: categoryAnalysis,
    vendors: vendorAnalysis,
    largestExpenses,
    pendingOrPartialExpenses,
  };
}
