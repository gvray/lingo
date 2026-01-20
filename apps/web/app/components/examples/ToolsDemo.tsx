"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function ToolsDemo() {
  const [calculatorExpr, setCalculatorExpr] = useState("12 * (3 + 4)");
  const [city, setCity] = useState("北京");
  const [query, setQuery] = useState("北京天气");
  const [results, setResults] = useState<Record<string, unknown>>({});

  const run = async () => {
    setResults({});
    const res = await fetch(`${API_URL}/api/examples/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calculatorExpr, city, query }),
    });
    const data = await res.json();
    setResults(data.results || {});
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-zinc-300">计算表达式</label>
          <input
            value={calculatorExpr}
            onChange={(e) => setCalculatorExpr(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-300">城市</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-300">搜索关键词</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          />
        </div>
      </div>
      <button onClick={run} className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200">
        运行
      </button>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </div>
    </div>
  );
}
