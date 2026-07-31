import OpenAI from "openai";
import { z } from "zod";
import type { AiReportContext, AiReportFilters, AiReportResult } from "@/lib/ai-report/types";
import { getAiReportPeriodLabel } from "@/lib/ai-report/params";

const aiResponseSchema = z.object({
  executive_summary: z.string().min(1),
  key_findings: z.array(z.string().min(1)).min(1),
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

export async function generateAiReport(
  filters: AiReportFilters,
  context: AiReportContext,
): Promise<AiReportResult> {
  const client = getOpenAiClient();
  const model = getModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a CFO-style executive assistant for a budget management app. Analyze the provided financial data and return JSON only with keys: executive_summary (string), key_findings (string[]), recommendations (string[]), risk_alerts (string[]). Keep recommendations practical and specific. Mention currency-aware amounts when useful.",
      },
      {
        role: "user",
        content: JSON.stringify({
          period: context.period_label,
          currency: context.currency,
          data: context,
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
    title: "Executive AI report",
    period_label: getAiReportPeriodLabel(filters),
    currency: filters.currency,
    executive_summary: parsed.data.executive_summary,
    key_findings: parsed.data.key_findings,
    recommendations: parsed.data.recommendations,
    risk_alerts: parsed.data.risk_alerts,
    generated_at: new Date().toISOString(),
  };
}
