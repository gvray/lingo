import { Hono } from "hono";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export const examplesModelsRoute = new Hono();

examplesModelsRoute.post("/", async (c) => {
  const { prompt, temperature = 0.2, topP = 1, maxTokens } = await c.req.json();
  const model = new ChatOpenAI({
    model: process.env.MODEL || "gpt-4o",
    apiKey: process.env.API_KEY,
    configuration: { baseURL: process.env.BASE_URL || "https://api.openai.com/v1" },
    temperature,
    topP,
    maxTokens,
  });
  const res = await model.invoke([new HumanMessage(prompt)]);
  return c.json({ output: typeof res.content === "string" ? res.content : "" });
});

