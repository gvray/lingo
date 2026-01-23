import { Hono } from "hono";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { StateGraph, START, END, Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { DynamicStructuredTool } from "@langchain/core/tools";
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

const model = createLLM();
const tools: DynamicStructuredTool[] = allTools;
const modelWithTools = model.bindTools(tools);

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});
const callModel = async (state: typeof StateAnnotation.State) => {
  const res = await modelWithTools.invoke(state.messages);
  const msg = res instanceof AIMessage ? res : new AIMessage(String(res?.content ?? ""));
  return { messages: [msg] };
};
function shouldContinue(state: typeof StateAnnotation.State) {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  return last?.tool_calls && last.tool_calls.length > 0 ? "tools" : END;
}
const graph = new StateGraph(StateAnnotation)
  .addNode("call_model", callModel)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "call_model")
  .addConditionalEdges("call_model", shouldContinue)
  .addEdge("tools", "call_model")
  .compile({ checkpointer });


chatRoute.post("/", async (c) => {
  const { messages, stream, threadId } = await c.req.json();

  if (!threadId) {
    return c.json({ error: "threadId is required for memory support" }, 400);
  }

  // 追踪 threadId
  memoryStats.track(threadId);

  if (stream) {
    const stateMessages = [
      new SystemMessage(SYSTEM_PROMPT),
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
          for await (const item of streamResponse) {
            const [token] = item as [unknown, unknown];
            const text =
              typeof token === "string"
                ? token
                : (token as { text?: string })?.text ?? "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const stateMessages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...messages.map((m: { role: string; content: string }) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];
  const resultState = await graph.invoke(
    { messages: stateMessages },
    { configurable: { thread_id: threadId } }
  );
  const last = (resultState.messages as BaseMessage[])[(resultState.messages as BaseMessage[]).length - 1] as AIMessage;
  const content = typeof last?.content === "string" ? last.content : "";

  return c.json({ content, threadId });
});
