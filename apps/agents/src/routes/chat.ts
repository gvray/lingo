import { Hono } from "hono";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END, StateGraphArgs } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
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
const tools = allTools as any;
const modelWithTools = (model as any).bindTools ? (model as any).bindTools(tools) : model;

type AgentState = { messages: Array<HumanMessage | AIMessage | SystemMessage> };
const graphState: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    value: (x: AgentState["messages"], y: AgentState["messages"]) => x.concat(y),
    default: () => [],
  },
};
const callModel = async (state: AgentState) => {
  const res = await modelWithTools.invoke(state.messages);
  return { messages: [res as AIMessage] };
};
function shouldContinue(state: AgentState) {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  return last?.tool_calls && last.tool_calls.length > 0 ? "tools" : END;
}
const graph = new StateGraph<AgentState>({ channels: graphState })
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
      { messages: stateMessages as AgentState["messages"] },
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
    new SystemMessage(SYSTEM_PROMPT),
    ...messages.map((m: { role: string; content: string }) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ];
  const resultState = (await graph.invoke(
    { messages: stateMessages as AgentState["messages"] },
    { configurable: { thread_id: threadId } }
  )) as AgentState;
  const last = resultState.messages[resultState.messages.length - 1] as AIMessage;
  const content = typeof last?.content === "string" ? last.content : "";

  return c.json({ content, threadId });
});
