import { Hono } from "hono";
import { HumanMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model";
import { buildTranslatePrompt } from "../prompts";

export const translateRoute = new Hono();

translateRoute.post("/", async (c) => {
  const { text, targetLang, sourceLang, stream } = await c.req.json();
  const model = createModel();

  const prompt = await buildTranslatePrompt(text, targetLang, sourceLang);
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
  return c.json({ translation: response.content });
});
