import { PromptTemplate } from "@langchain/core/prompts";

export const summaryPromptTemplate = PromptTemplate.fromTemplate(
  `请对以下文本进行总结。

要求:
- 提取核心观点和关键信息
- 保持逻辑清晰，结构分明
- 语言简洁，避免冗余
{language_instruction}

文本内容:
{text}

总结:`
);

export function buildSummaryPrompt(text: string, language?: string) {
  const languageInstruction = language
    ? `- 使用${language}输出`
    : "- 使用原文语言输出";

  return summaryPromptTemplate.format({
    text,
    language_instruction: languageInstruction,
  });
}
