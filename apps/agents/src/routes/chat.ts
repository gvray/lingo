import { Hono } from "hono";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model";
import { allTools } from "../tools";
import { defaultToolErrorHandler } from "../middleware/tool-error-handler";

export const chatRoute = new Hono();

const SYSTEM_PROMPT = `你是一个智能助手，可以使用工具帮助用户。
可用工具:
- calculator: 计算数学表达式
- get_current_time: 获取当前时间
- get_weather: 获取全球城市实时天气
- search_web: 搜索网络信息

请根据用户问题合理使用工具，用中文回答。`;

chatRoute.post("/", async (c) => {
  const { messages, stream, useTools = true } = await c.req.json();
  const baseModel = createModel();
  const model = useTools ? baseModel.bindTools(allTools) : baseModel;

  const langchainMessages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    ...messages.map((msg: { role: string; content: string }) => {
      switch (msg.role) {
        case "system": return new SystemMessage(msg.content);
        case "assistant": return new AIMessage(msg.content);
        default: return new HumanMessage(msg.content);
      }
    }),
  ];

  const runAgent = async (): Promise<string> => {
    let currentMessages = [...langchainMessages];
    const maxIterations = 5;

    for (let i = 0; i < maxIterations; i++) {
      const response = await model.invoke(currentMessages);
      currentMessages.push(response);

      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          const tool = allTools.find((t) => t.name === toolCall.name);
          if (tool) {
            const toolMessage = await defaultToolErrorHandler(
              toolCall,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (args) => (tool as any).invoke(args)
            );
            currentMessages.push(toolMessage);
          }
        }
      } else {
        return typeof response.content === "string" ? response.content : "";
      }
    }
    return "达到最大迭代次数";
  };

  if (stream) {
    const content = await runAgent();
    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const content = await runAgent();
  return c.json({ content });
});
