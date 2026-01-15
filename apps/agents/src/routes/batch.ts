import { Hono } from "hono";
import { createLLM } from "../lib/llm";

export const batchRoute = new Hono();

// 批量处理 - 使用 model.batch()
batchRoute.post("/", async (c) => {
  const { texts, task = "summarize" } = await c.req.json();

  if (!Array.isArray(texts) || texts.length === 0) {
    return c.json({ error: "texts must be a non-empty array" }, 400);
  }

  const model = createLLM();

  // 构建批量输入
  const prompts = texts.map((text: string) => {
    switch (task) {
      case "summarize":
        return `请用一句话总结以下内容：\n\n${text}`;
      case "translate":
        return `请翻译成英文：\n\n${text}`;
      case "sentiment":
        return `分析以下文本的情感（正面/负面/中性），只回复情感词：\n\n${text}`;
      default:
        return text;
    }
  });

  // 使用 batch 批量调用，限制并发
  const responses = await model.batch(prompts, {
    maxConcurrency: 3,
  });

  const results = responses.map((res, i) => ({
    input: texts[i],
    output: typeof res.content === "string" ? res.content : "",
  }));

  return c.json({ task, results });
});
