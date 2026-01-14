import { Hono } from "hono";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createModel } from "../lib/model";
import { allTools } from "../tools";
import { defaultToolErrorHandler } from "../middleware/tool-error-handler";
import { chatPromptTemplate } from "../prompts";

export const chatRoute = new Hono();

chatRoute.post("/", async (c) => {
  const { messages, stream, useTools = true } = await c.req.json();
  const baseModel = createModel();
  const model = useTools ? baseModel.bindTools(allTools) : baseModel;

  // 构建历史消息
  const history: BaseMessage[] = messages.slice(0, -1).map(
    (msg: { role: string; content: string }) => {
      return msg.role === "assistant"
        ? new AIMessage(msg.content)
        : new HumanMessage(msg.content);
    }
  );

  // 使用 PromptTemplate 格式化
  const lastMessage = messages[messages.length - 1];
  const formattedMessages = await chatPromptTemplate.formatMessages({
    history,
    input: lastMessage?.content || "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const langchainMessages = formattedMessages as any[];

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
