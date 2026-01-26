import { Hono } from "hono";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { memoryStats } from "../memory";
import { graph } from "../graphs/chat";

export const chatRoute = new Hono();

chatRoute.post("/", async (c) => {
  const { messages, stream, threadId } = await c.req.json();

  if (!threadId) {
    return c.json({ error: "threadId is required for memory support" }, 400);
  }

  // 追踪 threadId
  memoryStats.track(threadId);

  if (stream) {
    const stateMessages = [
      ...messages.map((m: { role: string; content: string }) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ];
    const streamResponse = await graph.stream(
      { messages: stateMessages },
      { configurable: { thread_id: threadId }, streamMode: "messages" }
    );

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const [token] of streamResponse as any) {
            const text = token?.text ?? (typeof token === "string" ? token : "");
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const stateMessages = [
    ...messages.map((m: { role: string; content: string }) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];
  const resultState = await graph.invoke(
    { messages: stateMessages },
    { configurable: { thread_id: threadId } }
  );
  const last = (resultState.messages as Array<HumanMessage | AIMessage>)[
    (resultState.messages as Array<HumanMessage | AIMessage>).length - 1
  ] as AIMessage;
  const content = typeof last?.content === "string" ? last.content : "";

  return c.json({ content, threadId });
});
