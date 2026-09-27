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
  paidAt?: string | null;
  paymentMethod?: string | null;
  hasEvidence?: boolean;
  evidenceCount?: number;
};

export type AiCfoSource = {
  expenseCount: number;
  categoryCount: number;
  projectCount: number;
  periodLabel: string | null;
};

export type AiCfoProjectRef = {
  id: string;
  name: string;
  description?: string | null;
};

export type AiCfoChatResponse = {
  type: "answer" | "project_selection_required" | "project_selection_ambiguous" | "project_not_found";
  message: string;
  conversationId: string | null;
  projectContext: AiCfoProjectRef | null;
  queryProject?: AiCfoProjectRef | null;
  evidence?: AiCfoEvidenceExpense[];
  source?: AiCfoSource | null;
  originalQuestion?: string;
  projects?: AiCfoProjectRef[];
  allowMultiple?: boolean;
  favoriteId?: string | null;
};
