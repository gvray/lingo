import { Hono } from "hono";
import { createLLM } from "../lib/llm";
import {
  ContactInfoSchema,
  ProductReviewSchema,
  ArticleMetadataSchema,
  TaskSchema,
} from "../schemas";
import { z } from "zod";

export const extractRoute = new Hono();

// 提取联系人信息
extractRoute.post("/contact", async (c) => {
  const { text } = await c.req.json();

  const model = createLLM();
  const ContactNormalized = z.object({
    name: z.string().describe("姓名"),
    email: z.string().nullable().default(null).describe("邮箱地址"),
    phone: z.string().nullable().default(null).describe("电话号码"),
    company: z.string().nullable().default(null).describe("公司名称"),
  });
  const structuredModel = model.withStructuredOutput(ContactNormalized);

  const result = await structuredModel.invoke(
    `请从下面文本中提取联系人信息，并只以 json 对象返回：\n\n${text}`
  );

  return c.json({
    data: result,
  });
});

// 分析产品评论
extractRoute.post("/review", async (c) => {
  const { text } = await c.req.json();

  const model = createLLM();
  const ReviewNormalized = z.object({
    rating: z.number().nullable().default(null).describe("评分 1-5"),
    sentiment: z.enum(["positive", "negative", "neutral"]).describe("情感倾向"),
    pros: z.array(z.string()).describe("优点列表"),
    cons: z.array(z.string()).describe("缺点列表"),
    summary: z.string().describe("简短总结"),
  });
  const structuredModel = model.withStructuredOutput(ReviewNormalized);

  const result = await structuredModel.invoke(
    `分析以下产品评论，并只以 json 对象返回：\n\n${text}`
  );

  return c.json({
    data: result,
  });
});

// 提取文章元数据
extractRoute.post("/article", async (c) => {
  const { text } = await c.req.json();

  const model = createLLM();
  const ArticleNormalized = z.object({
    title: z.string().describe("文章标题"),
    author: z.string().nullable().default(null).describe("作者"),
    publishDate: z.string().nullable().default(null).describe("发布日期"),
    category: z.string().describe("文章分类"),
    tags: z.array(z.string()).describe("关键标签"),
    language: z.string().describe("文章语言"),
  });
  const structuredModel = model.withStructuredOutput(ArticleNormalized);

  const result = await structuredModel.invoke(
    `提取以下文章的元数据信息，并只以 json 对象返回：\n\n${text}`
  );

  return c.json({
    data: result,
  });
});

// 从文本提取任务
extractRoute.post("/tasks", async (c) => {
  const { text } = await c.req.json();

  const model = createLLM();
  const TaskNormalized = z.object({
    tasks: z
      .array(
        z.object({
          title: z.string().describe("任务标题"),
          priority: z.enum(["high", "medium", "low"]).describe("优先级"),
          dueDate: z.string().nullable().default(null).describe("截止日期"),
          assignee: z.string().nullable().default(null).describe("负责人"),
        })
      )
      .describe("任务列表"),
  });
  const structuredModel = model.withStructuredOutput(TaskNormalized);

  const result = await structuredModel.invoke(
    `从以下文本中提取待办任务列表，并只以 json 对象返回：\n\n${text}`
  );

  return c.json({
    data: result,
  });
});
