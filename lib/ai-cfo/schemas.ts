import { z } from "zod";
import { DATE_PRESETS } from "@/lib/ai-cfo/dates";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const dateRangeSchema = z
  .object({
    preset: z.enum(DATE_PRESETS).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional(),
    quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
  })
  .optional();

export const toolArgsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string().trim().max(200).optional(),
  projectId: z.string().uuid().optional(),
  projectName: z.string().trim().max(200).optional(),
  expenseId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  status: z.enum(["pending", "partial", "paid"]).optional(),
  basis: z.enum(["paid", "budget"]).optional(),
  dateRange: dateRangeSchema,
  limit: z.number().int().min(1).max(50).optional(),
});

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(2000).optional(),
    conversationId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    activeProjectId: z.string().uuid().optional(),
    projectIds: z.array(z.string().uuid()).max(8).optional(),
    originalQuestion: z.string().trim().min(1).max(2000).optional(),
    favoriteId: z.string().uuid().optional(),
    intent: z.enum(["ask", "select_project", "change_project"]).optional(),
  })
  .superRefine((value, context) => {
    const intent = value.intent ?? "ask";

    if (intent === "ask" && !value.message) {
      context.addIssue({ code: "custom", message: "message is required", path: ["message"] });
    }

    if (intent === "change_project" && !value.projectId) {
      context.addIssue({ code: "custom", message: "projectId is required", path: ["projectId"] });
    }

    if (intent === "select_project" && !value.projectId && (!value.projectIds || value.projectIds.length === 0)) {
      context.addIssue({ code: "custom", message: "projectId is required", path: ["projectId"] });
    }
  });

export type ToolArgs = z.infer<typeof toolArgsSchema>;
