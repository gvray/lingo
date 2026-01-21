import { Hono } from "hono";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { calculator, getCurrentTime, getWeather, searchWeb } from "../../tools";
import { z } from "zod";

export const examplesModelsRoute = new Hono();

examplesModelsRoute.post("/", async (c) => {
  const body = await c.req.json();
  const {
    mode = "invoke",
    prompt = "",
    prompts,
    tool = "calculator",
    execute = false,
    temperature = 0.2,
    topP = 1,
    maxTokens,
    text,
  } = body;

  const model = new ChatOpenAI({
    model: process.env.MODEL || "gpt-4o",
    apiKey: process.env.API_KEY,
    configuration: { baseURL: process.env.BASE_URL || "https://api.openai.com/v1" },
    temperature,
    topP,
    maxTokens,
  });

  if (mode === "invoke") {
    const res = await model.invoke([new HumanMessage(prompt)]);
    return c.json({ output: typeof res.content === "string" ? res.content : "" });
  }

  if (mode === "stream") {
    const streamResp = await model.stream([new HumanMessage(prompt)]);
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResp) {
            const text = typeof chunk.content === "string" ? chunk.content : "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  if (mode === "batch") {
    const list: string[] = Array.isArray(prompts)
      ? prompts
      : String(prompt || "").split(/\r?\n/).filter(Boolean);
    if (list.length === 0) {
      return c.json({ error: "prompts must be non-empty" }, 400);
    }
    const responses = await model.batch(list, { maxConcurrency: 3 });
    const results = responses.map((res, i) => ({
      input: list[i],
      output: typeof res.content === "string" ? res.content : "",
    }));
    return c.json({ results });
  }

  if (mode === "bindTools") {
    const registry: Record<string, any> = {
      calculator,
      get_current_time: getCurrentTime,
      get_weather: getWeather,
      search_web: searchWeb,
    };
    const requested = String(tool);
    const selectedTools = requested
      ? [registry[requested] ?? calculator]
      : Object.values(registry);
    const bound = model.bindTools(selectedTools);
    const res = await bound.invoke([new HumanMessage(prompt)]);
    const toolCalls = (res as any).tool_calls ?? [];
    const executed: Array<{ name: string; result: unknown }> = [];
    if (execute && Array.isArray(toolCalls)) {
      for (const call of toolCalls) {
        const callName = String(call?.name);
        const args = (call?.args ?? {}) as any;
        const impl = registry[callName];
        if (impl && typeof (impl as any).invoke === "function") {
          const result = await (impl as any).invoke(args);
          executed.push({ name: callName, result });
        }
      }
    }
    return c.json({
      output: typeof res.content === "string" ? res.content : "",
      toolCalls,
      executed,
    });
  }

  if (mode === "structured") {
    const ContactSchema = z.object({
      name: z.string(),
      email: z.string().nullable().default(null),
      phone: z.string().nullable().default(null),
    });
    const structuredModel = model.withStructuredOutput(ContactSchema);
    const res = await structuredModel.invoke(
      String(text ?? prompt ?? "联系人：张三，邮箱：zhang@example.com，电话：13800138000。")
    );
    return c.json({ data: res });
  }

  return c.json({ error: `unknown mode: ${mode}` }, 400);
});
