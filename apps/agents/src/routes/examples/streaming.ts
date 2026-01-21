import { Hono } from "hono";
import { createLLM } from "../../lib/llm";
import { HumanMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";

export const examplesStreamingRoute = new Hono();

examplesStreamingRoute.post("/", async (c) => {
  const { prompt, mode } = await c.req.json();
  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是流式输出演示助手。",
  });
  const inputMessages = [
    new HumanMessage(
      typeof prompt === "string" ? prompt : "请演示不同的流式输出模式。"
    ),
  ];
  const encoder = new TextEncoder();
  const selected = typeof mode === "string" ? mode : "values";
  if (selected === "values") {
    const stream = await agent.stream({ messages: inputMessages }, { streamMode: "values" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream as any) {
            console.log('chunk',chunk);
            const last = chunk.messages?.at(-1);
            const text = typeof last?.content === "string" ? last.content : "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  if (selected === "updates") {
    const stream = await agent.stream({ messages: inputMessages }, { streamMode: "updates" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream as any) {
            console.log('chunk',chunk);
            const [step, content] = Object.entries(chunk)[0] as [string, unknown];
            const line = JSON.stringify({ step, content }) + "\n";
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  if (selected === "messages") {
    const stream = await agent.stream({ messages: inputMessages }, { streamMode: "messages" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const item of stream as any) {
            console.log('item',item);
            let line = "";
            if (Array.isArray(item)) {
              const [token, metadata] = item as any;
              line = JSON.stringify({ node: metadata?.langgraph_node, text: token?.text ?? String(token) }) + "\n";
            } else if (item?.messages) {
              const last = item.messages?.at(-1);
              const text = typeof last?.content === "string" ? last.content : "";
              line = text ? text : JSON.stringify(item) + "\n";
            } else {
              line = JSON.stringify(item) + "\n";
            }
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  if (selected === "custom") {
    const stream = await agent.stream({ messages: inputMessages }, { streamMode: "custom" });
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode("custom: 本示例未启用 writer，自定义更新可能为空\n"));
          for await (const chunk of stream as any) {
            console.log('chunk',chunk);
            const text =
              typeof chunk === "string"
                ? chunk
                : JSON.stringify(chunk) + "\n";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
  const stream = await agent.stream({ messages: inputMessages }, { streamMode: "values" });
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream as any) {
          console.log('chunk',chunk);
          const last = chunk.messages?.at(-1);
          const text = typeof last?.content === "string" ? last.content : "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
});