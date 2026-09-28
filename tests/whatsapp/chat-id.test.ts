import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWaapiChatId } from "@/lib/whatsapp/chat-id";

describe("WaAPI chat id resolution", () => {
  it("uses the serialized lid when WaAPI resolves the number", async () => {
    const fetchImpl: typeof fetch = async () => new Response(
      JSON.stringify({
        status: "success",
        data: {
          status: "success",
          data: { numberId: { _serialized: "193325218963680@lid" } },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

    const chatId = await resolveWaapiChatId(fetchImpl, { token: "token", instanceId: "42" }, "491701234567");
    assert.equal(chatId, "193325218963680@lid");
  });

  it("falls back to @c.us when lookup fails", async () => {
    const fetchImpl: typeof fetch = async () => new Response("{}", { status: 500 });

    const chatId = await resolveWaapiChatId(fetchImpl, { token: "token", instanceId: "42" }, "244923000000");
    assert.equal(chatId, "244923000000@c.us");
  });
});
