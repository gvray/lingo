"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function MemoryDemo() {
  const [threadId, setThreadId] = useState("demo_thread");
  const [input, setInput] = useState("我叫小明");
  const [logs, setLogs] = useState<string[]>([]);

  const run = async () => {
    setLogs((prev) => [...prev, `> 用户: ${input}`]);
    const res = await fetch(`${API_URL}/api/examples/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, input }),
    });
    const data = await res.json();
    setLogs((prev) => [...prev, `AI: ${data.content || ""}`]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
          className="w-48 bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          placeholder="threadId"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          placeholder="输入消息（例如：我叫什么？）"
        />
        <button onClick={run} className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200">
          运行
        </button>
      </div>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        {logs.length === 0 ? "日志将在这里显示" : logs.join("\n")}
      </div>
    </div>
  );
}

