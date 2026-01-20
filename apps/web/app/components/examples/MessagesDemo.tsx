"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function MessagesDemo() {
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "user", content: "我叫小明" },
    { role: "assistant", content: "你好，小明！" },
  ]);
  const [input, setInput] = useState("我叫什么？");
  const [output, setOutput] = useState("");

  const run = async () => {
    setOutput("");
    const res = await fetch(`${API_URL}/api/examples/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, input }),
    });
    const data = await res.json();
    setOutput(data.output || "");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
          历史消息:
          {history.map((m, i) => (
            <div key={i} className="mt-2">
              <span className="text-zinc-400">{m.role === "user" ? "你" : "Lingo"}: </span>
              <span>{m.content}</span>
            </div>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          placeholder="输入当前问题"
        />
      </div>
      <button onClick={run} className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200">
        运行
      </button>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        {output || "输出将在这里显示"}
      </div>
    </div>
  );
}

