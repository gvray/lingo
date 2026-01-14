import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

const examplePrompt = PromptTemplate.fromTemplate(
  `原文: {input}
译文: {output}`
);

const examples = [
  { input: "Hello, how are you?", output: "你好，你好吗？" },
  { input: "今天天气真好", output: "The weather is really nice today" },
  { input: "人工智能正在改变世界", output: "Artificial intelligence is changing the world" },
];

export const translateFewShotTemplate = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  prefix: `你是一个专业翻译。请将文本翻译成{target_lang}。

要求:
- 只输出翻译结果，不要解释
- 保持原文的语气和风格
- 专业术语翻译准确

示例:`,
  suffix: `原文: {text}
译文:`,
  inputVariables: ["target_lang", "text"],
});

export async function buildTranslatePrompt(
  text: string,
  targetLang: string,
  sourceLang?: string
) {
  return translateFewShotTemplate.format({
    target_lang: targetLang,
    text,
  });
}
