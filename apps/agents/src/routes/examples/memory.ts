import { Hono } from "hono";
import { createAgent } from "langchain";
import { createLLM } from "../../lib/llm";
import { checkpointer, memoryStats } from "../../memory";

export const examplesMemoryRoute = new Hono();

examplesMemoryRoute.post("/", async (c) => {
  const { input, threadId } = await c.req.json();
  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是记忆演示 Agent，会记住用户的上下文。",
    checkpointer: checkpointer as any,
  });

  memoryStats.track(threadId || "examples_memory");
  const result = await agent.invoke(
    { messages: [{ role: "user", content: input }] },
    { configurable: { thread_id: threadId } }
  );
  const last = result.messages.at(-1);
  const content = typeof last?.content === "string" ? last.content : "";
  return c.json({ content });
});

