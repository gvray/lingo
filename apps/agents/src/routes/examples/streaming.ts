import { Hono } from "hono";
import { createLLM } from "../../lib/llm";
import { HumanMessage } from "@langchain/core/messages";

export const examplesStreamingRoute = new Hono();

examplesStreamingRoute.post("/", async (c) => {
  const { prompt } = await c.req.json();
  const model = createLLM();
  const streamResp = await model.stream([new HumanMessage(prompt)]);
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of streamResp) {
          const text = typeof chunk.content === "string" ? chunk.content : "";
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
});

