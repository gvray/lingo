import { Hono } from "hono";
import { HumanMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model";
import { buildSummaryPrompt } from "../prompts";

export const summaryRoute = new Hono();

summaryRoute.post("/", async (c) => {
  const { text, language, stream } = await c.req.json();
  const model = createModel();

  const prompt = await buildSummaryPrompt(text, language);
  const messages = [new HumanMessage(prompt)];

  if (stream) {
    const streamResponse = await model.stream(messages);
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

  const response = await model.invoke(messages);
  return c.json({ summary: response.content });
});
