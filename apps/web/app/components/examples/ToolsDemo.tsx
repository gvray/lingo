"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function ToolsDemo() {
  const [city, setCity] = useState("北京");
  const [output, setOutput] = useState("");

  const run = async () => {
    setOutput("");
    const res = await fetch(`${API_URL}/api/examples/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city }),
    });
    const data = await res.json();
    setOutput(typeof data.output === "string" ? data.output : JSON.stringify(data, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-zinc-300">城市</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          />
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
