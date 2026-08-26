import { z } from "zod";
import { DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";
import { PROJECT_STATUSES } from "@/lib/projects/types";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(100, "Project name must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional()
    .nullable()
    .transform((val) => val || null),
  budget_amount: z.coerce
    .number({ error: "Budget amount must be a valid number." })
    .min(0, "Budget amount cannot be negative.")
    .default(0),
  currency: z
    .enum(EXPENSE_CURRENCIES, { error: "Select a valid currency." })
    .default(DEFAULT_EXPENSE_CURRENCY),
  status: z.enum(PROJECT_STATUSES, { error: "Select a valid status." }).default("active"),
});

export type ProjectSchemaInput = z.infer<typeof projectSchema>;
