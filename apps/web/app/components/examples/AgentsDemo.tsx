"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function AgentsDemo() {
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState("");

  const handleInvoke = async () => {
    setOutput("");
    const res = await fetch(`${API_URL}/api/examples/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, threadId, stream: streaming }),
    });
    if (streaming) {
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setOutput((prev) => prev + text);
      }
    } else {
      const data = await res.json();
      setOutput(data.content || "");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入问题（如：北京天气）"
          className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
        />
        <input
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
          placeholder="threadId（可选）"
          className="w-48 bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
        />
        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => setStreaming(e.target.checked)}
          />
          流式
        </label>
        <button
          onClick={handleInvoke}
          className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200"
        >
          运行
        </button>
      </div>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        {output || "输出将在这里显示"}
      </div>
    </div>
  );
}

