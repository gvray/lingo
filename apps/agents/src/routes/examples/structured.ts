import { Hono } from "hono";
import { z } from "zod";
import { createLLM } from "../../lib/llm";
import { createAgent, toolStrategy } from "langchain";

export const examplesStructuredRoute = new Hono();

examplesStructuredRoute.post("/", async (c) => {
  const { text } = await c.req.json();
  const ContactSchema = z.object({
    name: z.string().describe("姓名"),
    email: z.string().nullable().default(null).describe("邮箱"),
    phone: z.string().nullable().default(null).describe("电话"),
  });
  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt: "你是联系人提取助手，输出严格 JSON 字段：name、email、phone。",
    responseFormat: toolStrategy(ContactSchema),
  });
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content:
          `从文本中提取联系人信息，键名固定为 name、email、phone；缺失值用 null；只返回 json：\n\n${text}`,
      },
    ],
  });
  return c.json({ data: result.structuredResponse, raw: result.messages.at(-1)?.content });
});
