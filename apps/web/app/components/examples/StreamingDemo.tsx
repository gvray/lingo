"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function StreamingDemo() {
  const [prompt, setPrompt] = useState("用三个要点概述北京的冬天。");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"values" | "updates" | "messages" | "custom">("values");

  const run = async () => {
    setOutput("");
    setLoading(true);
    const res = await fetch(`${API_URL}/api/examples/streaming`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode }),
    });
    const reader = res.body?.getReader();
    if (!reader) {
      setLoading(false);
      return;
    }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      setOutput((prev) => prev + text);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
        rows={3}
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-300">模式</label>
        <select
          value={mode}
          onChange={(e) =>
            setMode(e.target.value as "values" | "updates" | "messages" | "custom")
          }
          className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
        >
          <option value="values">values</option>
          <option value="updates">updates</option>
          <option value="messages">messages</option>
          <option value="custom">custom</option>
        </select>
      </div>
      <button
        onClick={run}
        className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200"
        disabled={loading}
      >
        {loading ? "运行中..." : "运行"}
      </button>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        {output || "输出将在这里显示"}
      </div>
    </div>
  );
}
