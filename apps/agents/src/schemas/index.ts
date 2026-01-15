import { z } from "zod";

// 联系人信息提取
export const ContactInfoSchema = z.object({
  name: z.string().describe("姓名"),
  email: z.string().optional().describe("邮箱地址"),
  phone: z.string().optional().describe("电话号码"),
  company: z.string().optional().describe("公司名称"),
});

// 产品评论分析
export const ProductReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional().describe("评分 1-5"),
  sentiment: z.enum(["positive", "negative", "neutral"]).describe("情感倾向"),
  pros: z.array(z.string()).describe("优点列表"),
  cons: z.array(z.string()).describe("缺点列表"),
  summary: z.string().describe("简短总结"),
});

// 文章元数据提取
export const ArticleMetadataSchema = z.object({
  title: z.string().describe("文章标题"),
  author: z.string().optional().describe("作者"),
  publishDate: z.string().optional().describe("发布日期"),
  category: z.string().describe("文章分类"),
  tags: z.array(z.string()).describe("关键标签"),
  language: z.string().describe("文章语言"),
});

// 任务提取
export const TaskSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().describe("任务标题"),
    priority: z.enum(["high", "medium", "low"]).describe("优先级"),
    dueDate: z.string().optional().describe("截止日期"),
    assignee: z.string().optional().describe("负责人"),
  })).describe("任务列表"),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type ProductReview = z.infer<typeof ProductReviewSchema>;
export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
export type TaskList = z.infer<typeof TaskSchema>;
