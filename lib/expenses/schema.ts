import { z } from "zod";
import { EXPENSE_PAYMENT_METHODS, EXPENSE_PRIORITIES, EXPENSE_STATUSES } from "@/lib/expenses/types";
import { DEFAULT_EXPENSE_CURRENCY, EXPENSE_CURRENCIES } from "@/lib/currency/types";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().uuid().nullable().optional(),
);

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value : null),
    z.enum(values).nullable().optional(),
  );

export const projectScopedExpenseSchema = z.object({
  project_id: z.string().uuid("A valid Project ID is required."),
  date: z
    .string()
    .trim()
    .min(1, "Date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(500, "Description must be 500 characters or fewer."),
  category_id: optionalUuid,
  vendor_id: optionalUuid,
  budget_amount: z.coerce
    .number({ error: "Expense budget must be a number." })
    .min(0, "Expense budget cannot be negative."),
  paid_amount: z.coerce
    .number({ error: "Paid amount must be a number." })
    .min(0, "Paid amount cannot be negative.")
    .default(0),
  currency: z.enum(EXPENSE_CURRENCIES).default(DEFAULT_EXPENSE_CURRENCY),
  payment_method: optionalEnum(EXPENSE_PAYMENT_METHODS),
  priority: optionalEnum(EXPENSE_PRIORITIES),
  status: z.enum(EXPENSE_STATUSES).default("pending"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer.")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type ProjectScopedExpenseSchemaInput = z.infer<typeof projectScopedExpenseSchema>;
