"use client";

import { useState } from "react";

type ExtractType = "contact" | "review" | "article" | "tasks";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const extractTypes: { key: ExtractType; label: string; placeholder: string }[] = [
  {
    key: "contact",
    label: "联系人",
    placeholder: "输入包含联系人信息的文本，例如：\n张三，邮箱：zhangsan@example.com，电话：13800138000，来自阿里巴巴公司",
  },
  {
    key: "review",
    label: "评论分析",
    placeholder: "输入产品评论，例如：\n这款手机非常好用，拍照效果很棒，电池续航也不错。就是价格有点贵，发热有时比较严重。总体来说值得购买，给4分。",
  },
  {
    key: "article",
    label: "文章元数据",
    placeholder: "输入文章内容，例如：\n# 人工智能的未来\n作者：李明\n发布于2024年3月15日\n\n人工智能正在改变我们的生活...",
  },
  {
    key: "tasks",
    label: "任务提取",
    placeholder: "输入包含任务的文本，例如：\n明天下午3点前完成产品设计文档，优先级高。下周一之前小王需要完成用户调研报告。另外记得本周五提交周报。",
  },
];

export default function ExtractPanel() {
  const [type, setType] = useState<ExtractType>("contact");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentType = extractTypes.find((t) => t.key === type)!;

  const handleExtract = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/extract/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`);
      }

      const data = await res.json();
      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提取失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {extractTypes.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setType(t.key);
              setResult(null);
              setError("");
            }}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              type === t.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={currentType.placeholder}
        className="w-full h-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none"
        disabled={loading}
      />

      <button
        onClick={handleExtract}
        disabled={loading || !input.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "提取中..." : `提取${currentType.label}`}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-4">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            提取结果
          </h3>
          <pre className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
