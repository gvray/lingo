import { Hono } from "hono";
import { allTools } from "../../tools";
import { createLLM } from "../../lib/llm";
import { checkpointer, memoryStats } from "../../memory";

export const examplesAgentsRoute = new Hono();

examplesAgentsRoute.post("/", async (c) => {
  const { input, threadId, stream = false } = await c.req.json();
  const model = createLLM() as any;
  const modelWithTools = model.bindTools ? model.bindTools(allTools as any) : model;

  memoryStats.track(threadId || "examples");

  if (stream) {
    const streamResponse = await model.stream([{ role: "user", content: input }]);
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

  const result = await modelWithTools.invoke([{ role: "user", content: input }]);
  const content = typeof result.content === "string" ? result.content : "";
  return c.json({ content });
});
