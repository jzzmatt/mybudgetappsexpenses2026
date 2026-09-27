export type AiCfoEvidenceExpense = {
  id: string;
  date: string;
  description: string;
  category: string | null;
  project: string | null;
  paidAmount: number;
  budgetAmount: number;
  currency: string;
  status: string;
  paymentStatus: "paid" | "partial" | "unpaid";
};

export type AiCfoSource = {
  expenseCount: number;
  categoryCount: number;
  projectCount: number;
  periodLabel: string | null;
};

export type AiCfoChatResponse = {
  reply: string;
  conversationId: string | null;
  evidence: AiCfoEvidenceExpense[];
  source: AiCfoSource | null;
};
