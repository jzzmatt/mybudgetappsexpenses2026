export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  name: string;
  description?: string | null;
  status: string;
};

export type ProjectExpenseCurrencyTotals = {
  totalBudget: number;
  totalPaid: number;
  totalBalance: number;
};

export type ProjectExpenseTotals = {
  byCurrency: Partial<Record<string, ProjectExpenseCurrencyTotals>>;
  currencies: string[];
};
