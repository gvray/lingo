import { MemorySaver } from "@langchain/langgraph";

// 使用官方 MemorySaver 作为 checkpointer
export const checkpointer = new MemorySaver();

// 辅助统计（MemorySaver 内部是 Map，我们包装一下提供额外功能）
class MemoryStats {
  private threadIds = new Set<string>();

  track(threadId: string) {
    this.threadIds.add(threadId);
  }

  untrack(threadId: string) {
    this.threadIds.delete(threadId);
  }

  stats() {
    return { sessions: this.threadIds.size };
  }

  clear(threadId: string) {
    this.threadIds.delete(threadId);
  }
}

export const memoryStats = new MemoryStats();
