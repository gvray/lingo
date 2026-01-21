import { Hono } from "hono";
import { createLLM } from "../../lib/llm";
import { checkpointer, memoryStats } from "../../memory";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const examplesMemoryRoute = new Hono();

const threads = new Map<string, Array<AIMessage | HumanMessage>>();

examplesMemoryRoute.post("/", async (c) => {
  const { input, threadId } = await c.req.json();
  const model = createLLM();

  memoryStats.track(threadId || "examples_memory");
  const id = String(threadId || "examples_memory");
  const history = threads.get(id) ?? [];
  const messages = [...history, new HumanMessage(input)];
  const res = await model.invoke(messages);
  const content = typeof res.content === "string" ? res.content : "";
  threads.set(id, [...messages, new AIMessage(content)]);
  return c.json({ content });
});
