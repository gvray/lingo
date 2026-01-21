import { Hono } from "hono";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

export const examplesToolsRoute = new Hono();
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

  const model = new ChatOpenAI({
    model: process.env.MODEL || "gpt-4o",
    apiKey: process.env.API_KEY,
    configuration: { baseURL: process.env.BASE_URL || "https://api.openai.com/v1" },
  });
  const modelWithTool = (model as any).bindTools
    ? (model as any).bindTools([getWeather])
    : model;

  const res = await modelWithTool.invoke([
    { lc_namespace: ["langchain", "schema"], _type: "human", content: `请告诉我${city}的天气` },
  ]);
  const output = typeof res.content === "string" ? res.content : "";
  return c.json({ output });
});
