import { ChatOpenAI } from "@langchain/openai";

export function createLLM() {
  return new ChatOpenAI({
    model: process.env.MODEL || "gpt-4o",
    apiKey: process.env.API_KEY,
    temperature: process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : 0.7,
    configuration: {
      baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
    },
  });
}
