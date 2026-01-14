import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getCurrentTime = tool(
  async () => {
    const now = new Date();
    return now.toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  },
  {
    name: "get_current_time",
    description: "获取当前日期和时间（北京时间）",
    schema: z.object({}),
  }
);
