import { ToolMessage } from "@langchain/core/messages";

interface ToolCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

interface ToolErrorHandlerOptions {
  maxRetries?: number;
  logErrors?: boolean;
}

export function createToolErrorHandler(options: ToolErrorHandlerOptions = {}) {
  const { maxRetries = 1, logErrors = true } = options;

  return async function handleToolCall(
    toolCall: ToolCall,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolFn: (args: any) => Promise<string>
  ): Promise<ToolMessage> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await toolFn(toolCall.args);
        return new ToolMessage({
          tool_call_id: toolCall.id!,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (logErrors) {
          console.error(
            `[Tool Error] ${toolCall.name} (attempt ${attempt + 1}/${maxRetries + 1}):`,
            lastError.message
          );
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    return new ToolMessage({
      tool_call_id: toolCall.id!,
      content: `工具调用失败: ${toolCall.name}\n错误: ${lastError?.message || "未知错误"}\n请尝试其他方式或直接回答用户。`,
    });
  };
}

export const defaultToolErrorHandler = createToolErrorHandler({
  maxRetries: 1,
  logErrors: true,
});
