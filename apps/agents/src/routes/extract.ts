import { Hono } from "hono";
import { createAgent, toolStrategy } from "langchain";
import { createLLM } from "../lib/llm";
import {
  ContactInfoSchema,
  ProductReviewSchema,
  ArticleMetadataSchema,
  TaskSchema,
} from "../schemas";

export const extractRoute = new Hono();

// 提取联系人信息
extractRoute.post("/contact", async (c) => {
  const { text } = await c.req.json();

  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是一个信息提取助手，从文本中提取联系人信息。",
    responseFormat: toolStrategy(ContactInfoSchema),
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: `从以下文本中提取联系人信息：\n\n${text}` }],
  });

  return c.json({
    data: result.structuredResponse,
    raw: result.messages.at(-1)?.content,
  });
});

// 分析产品评论
extractRoute.post("/review", async (c) => {
  const { text } = await c.req.json();

  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是一个产品评论分析助手，分析用户评论的情感和关键点。",
    responseFormat: toolStrategy(ProductReviewSchema),
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: `分析以下产品评论：\n\n${text}` }],
  });

  return c.json({
    data: result.structuredResponse,
  });
});

// 提取文章元数据
extractRoute.post("/article", async (c) => {
  const { text } = await c.req.json();

  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是一个文章分析助手，提取文章的元数据信息。",
    responseFormat: toolStrategy(ArticleMetadataSchema),
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: `提取以下文章的元数据：\n\n${text}` }],
  });

  return c.json({
    data: result.structuredResponse,
  });
});

// 从文本提取任务
extractRoute.post("/tasks", async (c) => {
  const { text } = await c.req.json();

  const agent = createAgent({
    model: createLLM(),
    tools: [],
    systemPrompt: "你是一个任务提取助手，从文本中识别并提取待办任务。",
    responseFormat: toolStrategy(TaskSchema),
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: `从以下文本中提取任务列表：\n\n${text}` }],
  });

  return c.json({
    data: result.structuredResponse,
  });
});
