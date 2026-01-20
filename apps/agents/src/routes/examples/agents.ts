import { Hono } from "hono";
import { createAgent } from "langchain";
import { allTools } from "../../tools";
import { createLLM } from "../../lib/llm";
import { checkpointer, memoryStats } from "../../memory";

export const examplesAgentsRoute = new Hono();

examplesAgentsRoute.post("/", async (c) => {
  const { input, threadId, stream = false } = await c.req.json();
  const agent = createAgent({
    model: createLLM() as any,
    tools: allTools as any,
    systemPrompt: "你是演示用的 Agent，回答简洁，必要时调用工具。",
    checkpointer: checkpointer as any,
  });

  memoryStats.track(threadId || "examples");

  if (stream) {
    const streamResponse = await agent.stream(
      { messages: [{ role: "user", content: input }] },
      { configurable: { thread_id: threadId }, streamMode: "values" }
    );
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResponse) {
            const last = chunk.messages?.at(-1);
            const text = typeof last?.content === "string" ? last.content : "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const result = await agent.invoke(
    { messages: [{ role: "user", content: input }] },
    { configurable: { thread_id: threadId } }
  );
  const last = result.messages.at(-1);
  const content = typeof last?.content === "string" ? last.content : "";
  return c.json({ content });
});

