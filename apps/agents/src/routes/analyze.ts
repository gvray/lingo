import { Hono } from "hono";
import { z } from "zod";
import { createLLM } from "../lib/llm";

export const analyzeRoute = new Hono();

// 使用 model.withStructuredOutput() 进行结构化分析
analyzeRoute.post("/sentiment", async (c) => {
  const { text } = await c.req.json();

  const SentimentSchema = z.object({
    sentiment: z.enum(["positive", "negative", "neutral"]).describe("情感倾向"),
    confidence: z.number().min(0).max(1).describe("置信度 0-1"),
    keywords: z.array(z.string()).describe("情感关键词"),
    reason: z.string().describe("判断理由"),
  });

  const model = createLLM();
  const structuredModel = model.withStructuredOutput(SentimentSchema);

  const result = await structuredModel.invoke(
    `分析以下文本的情感：\n\n${text}`
  );

  return c.json({ data: result });
});

// 实体提取 - withStructuredOutput
analyzeRoute.post("/entities", async (c) => {
  const { text } = await c.req.json();

  const EntitiesSchema = z.object({
    persons: z.array(z.string()).describe("人名"),
    organizations: z.array(z.string()).describe("组织/公司名"),
    locations: z.array(z.string()).describe("地点"),
    dates: z.array(z.string()).describe("日期时间"),
    products: z.array(z.string()).describe("产品名称"),
  });

  const model = createLLM();
  const structuredModel = model.withStructuredOutput(EntitiesSchema);

  const result = await structuredModel.invoke(
    `从以下文本中提取所有实体：\n\n${text}`
  );

  return c.json({ data: result });
});

// 内容分类 - withStructuredOutput
analyzeRoute.post("/classify", async (c) => {
  const { text, categories } = await c.req.json();

  const defaultCategories = ["科技", "体育", "娱乐", "财经", "教育", "健康", "其他"];
  const cats = categories || defaultCategories;

  const ClassifySchema = z.object({
    category: z.string().describe("主要分类"),
    subCategory: z.string().optional().describe("子分类"),
    confidence: z.number().min(0).max(1).describe("置信度"),
    tags: z.array(z.string()).describe("相关标签"),
  });

  const model = createLLM();
  const structuredModel = model.withStructuredOutput(ClassifySchema);

  const result = await structuredModel.invoke(
    `将以下文本分类到这些类别之一：${cats.join(", ")}\n\n${text}`
  );

  return c.json({ data: result });
});
