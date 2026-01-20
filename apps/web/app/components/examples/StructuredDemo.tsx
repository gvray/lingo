"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function StructuredDemo() {
  const [text, setText] = useState("联系人：张三，邮箱：zhang@example.com，电话：13800138000。");
  const [data, setData] = useState<unknown>(null);

  const run = async () => {
    setData(null);
    const res = await fetch(`${API_URL}/api/examples/structured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    setData(json.data);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
        rows={3}
      />
      <button onClick={run} className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200">
        运行
      </button>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        <pre>{data ? JSON.stringify(data, null, 2) : "结构化结果将在这里显示"}</pre>
      </div>
    </div>
  );
}
