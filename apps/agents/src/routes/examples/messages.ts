import { Hono } from "hono";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createLLM } from "../../lib/llm";
import { chatPromptTemplate } from "../../prompts/chat";

export const examplesMessagesRoute = new Hono();

examplesMessagesRoute.post("/", async (c) => {
  const { history = [], input, template } = await c.req.json();
  const model = createLLM();
  const formattedHistory = history.map((m: { role: string; content: string }) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
  const messages =
    template === "chat"
      ? await chatPromptTemplate.formatMessages({
          history: formattedHistory,
          input,
        })
      : [...formattedHistory, new HumanMessage(input)];
  const res = await model.invoke(messages);
  return c.json({ output: typeof res.content === "string" ? res.content : "" });
});
