"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function ModelsDemo() {
  const [prompt, setPrompt] = useState("请用两句话介绍北京的冬天。");
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(256);
  const [output, setOutput] = useState("");

  const run = async () => {
    setOutput("");
    const res = await fetch(`${API_URL}/api/examples/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature, topP, maxTokens }),
    });
    const data = await res.json();
    setOutput(data.output || "");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          rows={3}
        />
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-zinc-300">
            temperature: {temperature}
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="text-sm text-zinc-300">
            topP: {topP}
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="text-sm text-zinc-300">
            maxTokens: {maxTokens}
            <input
              type="number"
              value={maxTokens ?? 0}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || undefined)}
              className="w-full bg-zinc-800 text-white px-2 py-1 rounded border border-zinc-700"
            />
          </label>
        </div>
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

