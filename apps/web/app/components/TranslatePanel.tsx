"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function TranslatePanel() {
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [targetLang, setTargetLang] = useState("Chinese");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setTranslation("");

    try {
      const res = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang, stream: true }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setTranslation((prev) => prev + decoder.decode(value));
      }
    } catch (error) {
      console.error(error);
      setTranslation("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to translate..."
          rows={4}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <div className="flex gap-2">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="Chinese">Chinese</option>
            <option value="English">English</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
      </form>

      {translation && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Translation</h3>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">{translation}</p>
        </div>
      )}
    </div>
  );
}
