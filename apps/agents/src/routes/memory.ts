import { Hono } from "hono";
import { memoryStats } from "../memory";

export const memoryRoute = new Hono();

// 获取内存统计
memoryRoute.get("/stats", (c) => {
  const stats = memoryStats.stats();
  return c.json(stats);
});

// 清除指定会话（注意：MemorySaver 不支持删除单个 thread，这里只清理统计）
memoryRoute.delete("/:threadId", (c) => {
  const threadId = c.req.param("threadId");
  memoryStats.clear(threadId);
  return c.json({ success: true, threadId, note: "Stats cleared. MemorySaver retains data in memory." });
});
