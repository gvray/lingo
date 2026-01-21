import { Hono } from "hono";
import { createLLM } from "../../lib/llm";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END, StateGraphArgs } from "@langchain/langgraph";

export const examplesStreamingRoute = new Hono();

// LangGraph: 定义图与节点（支持自定义 writer）
type Msg = { role: "system" | "user" | "assistant"; content: string };
type StreamState = { messages: Msg[] };
const channels: StateGraphArgs<StreamState>["channels"] = {
  messages: {
    value: (x: Msg[], y: Msg[]) => x.concat(y),
    default: () => [],
  },
};
const model = createLLM();
const callModel = async (state: StreamState, config?: any) => {
  const toCore = state.messages.map((m) =>
    m.role === "user"
      ? new HumanMessage(m.content)
      : m.role === "system"
      ? new SystemMessage(m.content)
      : new AIMessage(m.content)
  );
  let full = "";
  for await (const chunk of (await (model as any).stream(toCore)) as any) {
    const piece = typeof chunk?.content === "string" ? chunk.content : "";
    if (piece) {
      full += piece;
      // 自定义数据
      config?.writer?.write("progress", { token: piece.length, text: piece });
    }
  }
  return { messages: [{ role: "assistant", content: full }] };
};
const graph = new StateGraph<StreamState>({ channels })
  .addNode("call_model", callModel)
  .addEdge(START, "call_model")
  .addEdge("call_model", END)
  .compile();

examplesStreamingRoute.post("/", async (c) => {
  const { prompt, mode } = await c.req.json();
  const encoder = new TextEncoder();
  const selected = typeof mode === "string" ? mode : "values";
  const stateMessages: Msg[] = [
    { role: "system", content: "你是流式输出演示助手。" },
    { role: "user", content: typeof prompt === "string" ? prompt : "请演示不同的流式输出模式。" },
  ];

  if (selected === "values") {
    const stream = await graph.stream({ messages: stateMessages }, { streamMode: "values" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream as any) {
            const last = Array.isArray(chunk?.messages) ? chunk.messages.at(-1) : null;
            const text = last?.role === "assistant" && typeof last?.content === "string" ? last.content : "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (selected === "updates") {
    const stream = await graph.stream({ messages: stateMessages }, { streamMode: "updates" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream as any) {
            const line = JSON.stringify(chunk) + "\n";
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (selected === "messages") {
    const stream = await graph.stream({ messages: stateMessages }, { streamMode: "messages" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const [token, meta] of stream as any) {
            const line = JSON.stringify({ token, meta }) + "\n";
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (selected === "custom") {
    const stream = await graph.stream({ messages: stateMessages }, { streamMode: "custom" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode("custom: 自定义 writer 事件如下\n"));
          for await (const chunk of stream as any) {
            const line = JSON.stringify(chunk) + "\n";
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const stream = await graph.stream({ messages: stateMessages }, { streamMode: "values" });
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream as any) {
          const last = Array.isArray(chunk?.messages) ? chunk.messages.at(-1) : null;
          const text = last?.role === "assistant" && typeof last?.content === "string" ? last.content : "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
});
