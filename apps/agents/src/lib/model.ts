import { ChatOpenAI } from "@langchain/openai";

export function createModel() {
  return new ChatOpenAI({
    model: process.env.MODEL || "gpt-4o",
    apiKey: process.env.API_KEY,
    configuration: {
      baseURL: process.env.BASE_URL || "https://api.openai.com/v1",
    },
  });
}
