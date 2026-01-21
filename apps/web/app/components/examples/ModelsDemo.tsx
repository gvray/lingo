"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function ModelsDemo() {
  const [mode, setMode] = useState<"invoke" | "stream" | "batch" | "bindTools" | "structured">("invoke");
  const [prompt, setPrompt] = useState("请用两句话介绍北京的冬天。");
  const [promptsText, setPromptsText] = useState("用一句话总结北京冬天\n用一句话总结哈尔滨冬天");
  const [tool, setTool] = useState<"calculator" | "get_current_time" | "get_weather" | "search_web">("calculator");
  const [execute, setExecute] = useState(false);
  const [text, setText] = useState("联系人：张三，邮箱：zhang@example.com，电话：13800138000。");
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(1);
  const [maxTokens, setMaxTokens] = useState<number | undefined>(256);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setOutput("");
    setLoading(true);
    const payload: Record<string, unknown> = {
      mode,
      prompt,
      temperature,
      topP,
      maxTokens,
    };
    if (mode === "batch") {
      payload.prompts = promptsText.split(/\r?\n/).filter(Boolean);
    }
    if (mode === "bindTools") {
      payload.tool = tool;
      payload.execute = execute;
    }
    if (mode === "structured") {
      payload.text = text;
    }
    const res = await fetch(`${API_URL}/api/examples/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (mode === "stream") {
      const reader = res.body?.getReader();
      if (!reader) {
        setLoading(false);
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value);
        setOutput((prev) => prev + textChunk);
      }
      setLoading(false);
      return;
    }
    const data = await res.json();
    setLoading(false);
    setOutput(JSON.stringify(data, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-300">模式</label>
          <select
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "invoke" | "stream" | "batch" | "bindTools" | "structured")
            }
            className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          >
            <option value="invoke">invoke</option>
            <option value="stream">stream</option>
            <option value="batch">batch</option>
            <option value="bindTools">bindTools</option>
            <option value="structured">withStructuredOutput</option>
          </select>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
          rows={3}
        />
        {mode === "batch" && (
          <textarea
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
            rows={3}
            placeholder="每行一个 prompt"
          />
        )}
        {mode === "bindTools" && (
          <div className="flex items-center gap-3">
            <select
              value={tool}
              onChange={(e) =>
                setTool(e.target.value as "calculator" | "get_current_time" | "get_weather" | "search_web")
              }
              className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
            >
              <option value="calculator">calculator</option>
              <option value="get_current_time">get_current_time</option>
              <option value="get_weather">get_weather</option>
              <option value="search_web">search_web</option>
            </select>
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={execute}
                onChange={(e) => setExecute(e.target.checked)}
              />
              执行工具调用
            </label>
          </div>
        )}
        {mode === "structured" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
            rows={3}
            placeholder="输入包含联系人信息的文本"
          />
        )}
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
      <button onClick={run} className="px-3 py-2 rounded bg-white text-black hover:bg-zinc-200" disabled={loading}>
        运行
      </button>
      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 whitespace-pre-wrap">
        {output || "输出将在这里显示"}
      </div>
    </div>
  );
}
