import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculator = tool(
  async ({ expression }) => {
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
    const result = Function(`"use strict"; return (${sanitized})`)();
    return `${expression} = ${result}`;
  },
  {
    name: "calculator",
    description: "计算数学表达式，支持加减乘除、括号和取模运算",
    schema: z.object({
      expression: z.string().describe("数学表达式，如 '2 + 3 * 4' 或 '(10 + 5) / 3'"),
    }),
  }
);
