import { Hono } from "hono";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model";

export const summaryRoute = new Hono();

const SYSTEM_PROMPT = `You are a summarization assistant. Create clear, concise summaries.`;

summaryRoute.post("/", async (c) => {
  const { text, language, stream } = await c.req.json();
  const model = createModel();

  let prompt = `Summarize the following text`;
  if (language) prompt += ` in ${language}`;
  prompt += `:\n\n${text}`;

  const messages = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(prompt)];

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
