import { Hono } from "hono";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

export const examplesToolsRoute = new Hono();

// 单一案例：get_weather 工具 + createAgent 调用
const getWeather = tool(
  async ({ city }) => {
    return `${city}天气：晴天`;
  },
  {
    name: "get_weather",
    description: "获取城市天气",
    schema: z.object({
      city: z.string().describe("城市名称"),
    }),
  }
);

examplesToolsRoute.post("/", async (c) => {
  const { city = "北京" } = await c.req.json();

  const agent = createAgent({
    model: new ChatOpenAI({
      model: process.env.MODEL || "gpt-4o",
      apiKey: process.env.API_KEY,
      configuration: { baseURL: process.env.BASE_URL || "https://api.openai.com/v1" },
    }) as any,
    tools: [getWeather] as any,
    systemPrompt: "你是天气助手，遇到天气查询必须调用 get_weather 工具，回答简洁准确。",
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: `请告诉我${city}的天气` }],
  });

  const content = result.messages.at(-1)?.content;
  return c.json({ output: content });
});
