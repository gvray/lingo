import { Hono } from "hono";
import { z } from "zod";
import { createLLM } from "../../lib/llm";
import { createAgent, toolStrategy, providerStrategy } from "langchain";

export const examplesStructuredRoute = new Hono();

examplesStructuredRoute.post("/", async (c) => {
  const { text } = await c.req.json();
  const ContactSchema = z.object({
    name: z.string().describe("姓名"),
    email: z.string().nullable().default(null).describe("邮箱"),
    phone: z
      .string()
      .nullable()
      .default(null)
      .refine((val) => val === null || /^1[3-9]\d{9}$/.test(val), {
        message: "电话格式不合法",
      })
      .describe("电话号码，若无法确定请返回 null"),
  });
  const agent = createAgent({
    model: createLLM() as any,
    tools: [],
    systemPrompt:
      "你是联系人提取助手，输出严格 JSON 字段：name、email、phone。",
    // providerStrategy：模型直接吐 JSON 依赖模型支持provider 会翻车
    // toolStrategy：模型 tool_call 一次 → JSON 稳定
    // responseFormat: providerStrategy(ContactSchema),
    // responseFormat: toolStrategy(ContactSchema),
    responseFormat: toolStrategy(ContactSchema, {
      // TODO Custom tool message content
      // The toolMessageContent parameter allows you to customize the message that appears in the conversation history when structured output is generated:
      // 官网{ role: "tool", content: "Action item captured and added to meeting notes!", tool_call_id: "call_456", name: "MeetingAction" }
      // 但是实际是在AIMessage的content中
      toolMessageContent: `从文本中提取联系人信息，键名固定为 name、email、phone；缺失值用 null；只返回 json：\n\n${text}`,
      handleError: (err) => {
        console.error("handleError triggered:", err);
        return "提取联系人信息失败";
      },
    }),
  });
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `从文本中提取联系人信息，键名固定为 name、email、phone；缺失值用 null；只返回 json：\n\n${text}`,
      },
    ],
  });

  return c.json({
    data: result.structuredResponse,
    raw: result.messages.at(-1)?.content,
  });
});