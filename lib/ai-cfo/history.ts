import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loadConversation(userId: string, conversationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("ai_cfo_conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !conversation) {
    return null;
  }

  const { data: messages, error: messageError } = await supabase
    .from("ai_cfo_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (messageError || !messages) {
    return { id: conversationId, messages: [] as { role: "user" | "assistant"; content: string }[] };
  }

  return {
    id: conversationId,
    messages: messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: String(message.content),
      })),
  };
}

export async function saveConversationTurn(input: {
  userId: string;
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    let conversationId = input.conversationId;

    if (!conversationId) {
      const { data, error } = await supabase
        .from("ai_cfo_conversations")
        .insert({
          user_id: input.userId,
          title: input.userMessage.slice(0, 80),
        })
        .select("id")
        .single();

      if (error || !data) {
        console.info(JSON.stringify({ event: "ai_cfo_history_skipped", reason: error?.message ?? "insert_failed" }));
        return null;
      }

      conversationId = String(data.id);
    } else {
      await supabase
        .from("ai_cfo_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("user_id", input.userId)
        .eq("id", conversationId);
    }

    const { error: messageError } = await supabase.from("ai_cfo_messages").insert([
      {
        conversation_id: conversationId,
        user_id: input.userId,
        role: "user",
        content: input.userMessage,
      },
      {
        conversation_id: conversationId,
        user_id: input.userId,
        role: "assistant",
        content: input.assistantMessage,
      },
    ]);

    if (messageError) {
      console.info(JSON.stringify({ event: "ai_cfo_history_skipped", reason: messageError.message }));
      return conversationId;
    }

    return conversationId;
  } catch (error) {
    console.info(
      JSON.stringify({
        event: "ai_cfo_history_skipped",
        reason: error instanceof Error ? error.message : "history_failed",
      }),
    );
    return null;
  }
}
