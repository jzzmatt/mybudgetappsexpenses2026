import OpenAI from "openai";
import { z } from "zod";
import type { AiReportResult, ProjectAiReportContext } from "@/lib/ai-report/types";

const aiResponseSchema = z.object({
  executive_summary: z.string().min(1),
  spending_analysis: z.string().min(1),
  key_findings: z.array(z.string().min(1)).min(1),
  largest_items: z.array(z.string().min(1)).default([]),
  pending_items: z.array(z.string().min(1)).default([]),
  recommendations: z.array(z.string().min(1)).min(1),
  risk_alerts: z.array(z.string().min(1)).default([]),
});

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

export async function generateProjectAiReport(
  context: ProjectAiReportContext,
): Promise<AiReportResult> {
  const client = getOpenAiClient();
  const model = getModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a CFO-level financial advisor for project-based budget management. Analyze the deterministic financial statement of the requested project workspace and return JSON only with keys: executive_summary (string), spending_analysis (string), key_findings (string[]), largest_items (string[]), pending_items (string[]), recommendations (string[]), risk_alerts (string[]). Keep recommendations realistic, precise, and practical. Reference exact currency-aware values.",
      },
      {
        role: "user",
        content: JSON.stringify({
          project: context.project,
          financials: context.financials,
          categories: context.categories,
          vendors: context.vendors,
          largestExpenses: context.largestExpenses,
          pendingOrPartialExpenses: context.pendingOrPartialExpenses,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("The AI model returned an empty response.");
  }

  const parsed = aiResponseSchema.safeParse(JSON.parse(content));

  if (!parsed.success) {
    throw new Error("The AI model returned an invalid report format.");
  }

  return {
    title: `AI Financial Report: ${context.project.name}`,
    project_id: context.project.id,
    project_name: context.project.name,
    currency: context.project.currency,
    executive_summary: parsed.data.executive_summary,
    spending_analysis: parsed.data.spending_analysis,
    key_findings: parsed.data.key_findings,
    largest_items: parsed.data.largest_items,
    pending_items: parsed.data.pending_items,
    recommendations: parsed.data.recommendations,
    risk_alerts: parsed.data.risk_alerts,
    generated_at: new Date().toISOString(),
  };
}
