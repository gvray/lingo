import { Hono } from "hono";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model.js";

export const chatRoute = new Hono();

chatRoute.post("/", async (c) => {
  const { messages, stream } = await c.req.json();
  const model = createModel();

  const langchainMessages = messages.map((msg: { role: string; content: string }) => {
    switch (msg.role) {
      case "system": return new SystemMessage(msg.content);
      case "assistant": return new AIMessage(msg.content);
      default: return new HumanMessage(msg.content);
    }
  });

  if (stream) {
    const streamResponse = await model.stream(langchainMessages);
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResponse) {
            const text = typeof chunk.content === "string" ? chunk.content : "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const response = await model.invoke(langchainMessages);
  return c.json({ content: response.content });
});
