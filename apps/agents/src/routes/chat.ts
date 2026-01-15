import { Hono } from "hono";
import { createAgent } from "langchain";
import { createLLM } from "../lib/llm";
import { allTools } from "../tools";
import { checkpointer, memoryStats } from "../memory";

export const chatRoute = new Hono();

const SYSTEM_PROMPT = `你是一个智能助手，名叫 Lingo。

## 能力
你可以使用以下工具帮助用户:
- calculator: 计算数学表达式
- get_current_time: 获取当前时间
- get_weather: 获取全球城市实时天气
- search_web: 搜索网络信息

## 规则
1. 需要实时数据时，必须调用工具
2. 数学计算必须使用 calculator 工具
3. 回答简洁、准确
4. 使用中文回答`;

// 创建带 checkpointer 的 agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agent = createAgent({
  model: createLLM() as any,
  tools: allTools as any,
  systemPrompt: SYSTEM_PROMPT,
  checkpointer: checkpointer as any,
});

chatRoute.post("/", async (c) => {
  const { messages, stream, threadId } = await c.req.json();

  if (!threadId) {
    return c.json({ error: "threadId is required for memory support" }, 400);
  }

  // 追踪 threadId
  memoryStats.track(threadId);

  const lastMessage = messages[messages.length - 1];
  const userInput = lastMessage?.content || "";

  if (stream) {
    // 流式输出
    const streamResponse = await agent.stream(
      { messages: [{ role: "user", content: userInput }] },
      { configurable: { thread_id: threadId }, streamMode: "values" }
    );

    return new Response(
      new ReadableStream({
        async start(controller) {
          let lastContent = "";
          for await (const chunk of streamResponse) {
            const latestMessage = chunk.messages?.at(-1);
            if (latestMessage?.content && typeof latestMessage.content === "string") {
              const newContent = latestMessage.content.slice(lastContent.length);
              if (newContent) {
                controller.enqueue(new TextEncoder().encode(newContent));
                lastContent = latestMessage.content;
              }
            }
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  // 非流式
  const result = await agent.invoke(
    { messages: [{ role: "user", content: userInput }] },
    { configurable: { thread_id: threadId } }
  );

  const lastAIMessage = result.messages.at(-1);
  const content = typeof lastAIMessage?.content === "string" ? lastAIMessage.content : "";

  return c.json({ content, threadId });
});
