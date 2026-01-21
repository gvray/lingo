import { Hono } from "hono";
import { z } from "zod";
import { createLLM } from "../../lib/llm";

export const examplesStructuredRoute = new Hono();

examplesStructuredRoute.post("/", async (c) => {
  const { text } = await c.req.json();
  const ContactSchema = z.object({
    name: z.string().describe("姓名"),
    email: z.string().nullable().default(null).describe("邮箱"),
    phone: z.string().nullable().default(null).describe("电话"),
  });
  const model = createLLM();
  const structuredModel = model.withStructuredOutput(ContactSchema);
  const result = await structuredModel.invoke(
    `从文本中提取联系人信息，键名固定为 name、email、phone；缺失值用 null；只返回 json：\n\n${text}`
  );

  return c.json({
    data: result,
    raw: JSON.stringify(result),
  });
});
