import "server-only";

import OpenAI from "openai";
import { AI_CFO_DEFAULT_TIMEZONE, toIsoDate, zonedCalendarParts } from "@/lib/ai-cfo/dates";
import { guardUserQuestion } from "@/lib/ai-cfo/guard";
import { buildAiCfoSystemPrompt } from "@/lib/ai-cfo/prompt";
import { AiCfoDatabaseError } from "@/lib/ai-cfo/repository";
import { aiCfoToolDefinitions, executeAiCfoTool } from "@/lib/ai-cfo/tools";
import type { AiCfoEvidenceExpense, AiCfoSource } from "@/lib/ai-cfo/types";
import type { Locale } from "@/lib/i18n/config";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ModelMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
};

export class AiCfoOpenAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiCfoOpenAiError";
  }
}

function getModel() {
  return process.env.AI_CFO_MODEL || process.env.OPENAI_MODEL || "gpt-4o";
}

function getTimeZone() {
  return process.env.AI_CFO_TIMEZONE || AI_CFO_DEFAULT_TIMEZONE;
}

export async function runAiCfoChat(input: {
  userId: string;
  message: string;
  locale: Locale;
  history: HistoryMessage[];
  queryProjects: { id: string; name: string }[];
}) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const guarded = guardUserQuestion(input.message, input.locale);

  if (guarded) {
    logAiCfo({
      requestId,
      userId: input.userId,
      tools: [],
      durationMs: Date.now() - startedAt,
      success: true,
      model: null,
    });
    return {
      reply: guarded,
      evidence: [] as AiCfoEvidenceExpense[],
      source: null as AiCfoSource | null,
      tools: [] as string[],
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new AiCfoOpenAiError("OPENAI_API_KEY is not configured.");
  }

  const model = getModel();
  const timeZone = getTimeZone();
  const today = zonedCalendarParts(new Date(), timeZone);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const messages: ModelMessage[] = [
    {
      role: "system",
      content: buildAiCfoSystemPrompt(
        input.locale,
        toIsoDate(today.year, today.month, today.day),
        timeZone,
        input.queryProjects,
      ),
    },
    ...input.history.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: input.message },
  ];

  const toolsUsed: string[] = [];
  let evidence: AiCfoEvidenceExpense[] = [];
  let source: AiCfoSource | null = null;
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    for (let round = 0; round < 5; round += 1) {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.1,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        tools: aiCfoToolDefinitions,
      });

      promptTokens += completion.usage?.prompt_tokens ?? 0;
      completionTokens += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0]?.message;

      if (!choice) {
        throw new AiCfoOpenAiError("The AI model returned an empty response.");
      }

      const toolCalls = (choice.tool_calls ?? []).filter((toolCall) => toolCall.type === "function");

      if (toolCalls.length === 0) {
        const reply = choice.content?.trim();

        if (!reply) {
          throw new AiCfoOpenAiError("The AI model returned an empty response.");
        }

        logAiCfo({
          requestId,
          userId: input.userId,
          tools: toolsUsed,
          durationMs: Date.now() - startedAt,
          success: true,
          model,
          promptTokens,
          completionTokens,
        });

        return { reply, evidence, source, tools: toolsUsed };
      }

      messages.push({
        role: "assistant",
        content: choice.content ?? "",
        tool_calls: toolCalls.map((toolCall) => ({
          id: toolCall.id,
          type: "function" as const,
          function: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          },
        })),
      });

      for (const toolCall of toolCalls) {
        const name = toolCall.function.name;
        toolsUsed.push(name);
        const toolStarted = Date.now();
        let payload: unknown;

        try {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          payload = await executeAiCfoTool(input.userId, name, args, {
            projectIds: input.queryProjects.map((project) => project.id),
          });
        } catch (error) {
          if (error instanceof AiCfoDatabaseError) {
            throw error;
          }

          payload = { success: false, error: "tool_failed" };
        }

        const record = payload as { evidence?: AiCfoEvidenceExpense[]; source?: AiCfoSource };
        if (record.evidence && record.evidence.length > 0) {
          evidence = record.evidence;
        }
        if (record.source) {
          source = record.source;
        }

        console.info(
          JSON.stringify({
            event: "ai_cfo_tool",
            requestId,
            userId: input.userId,
            tool: name,
            durationMs: Date.now() - toolStarted,
            success: (payload as { success?: boolean }).success !== false,
          }),
        );

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(payload),
        });
      }
    }
  } catch (error) {
    logAiCfo({
      requestId,
      userId: input.userId,
      tools: toolsUsed,
      durationMs: Date.now() - startedAt,
      success: false,
      model,
      promptTokens,
      completionTokens,
    });

    if (error instanceof AiCfoDatabaseError || error instanceof AiCfoOpenAiError) {
      throw error;
    }

    throw new AiCfoOpenAiError(error instanceof Error ? error.message : "OpenAI request failed.");
  }

  throw new AiCfoOpenAiError("AI CFO could not finish the request.");
}

function logAiCfo(entry: {
  requestId: string;
  userId: string;
  tools: string[];
  durationMs: number;
  success: boolean;
  model: string | null;
  promptTokens?: number;
  completionTokens?: number;
}) {
  console.info(
    JSON.stringify({
      event: "ai_cfo_request",
      ...entry,
    }),
  );
}
