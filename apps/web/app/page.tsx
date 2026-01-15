"use client";

import { useState } from "react";
import ChatPanel from "./components/ChatPanel";
import SummaryPanel from "./components/SummaryPanel";
import TranslatePanel from "./components/TranslatePanel";
import ExtractPanel from "./components/ExtractPanel";

type Tab = "chat" | "summary" | "translate" | "extract";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl p-4">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Lingo</h1>
        
        <div className="mb-4 flex gap-2">
          {(["chat", "summary", "translate", "extract"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {activeTab === "chat" && <ChatPanel />}
          {activeTab === "summary" && <SummaryPanel />}
          {activeTab === "translate" && <TranslatePanel />}
          {activeTab === "extract" && <ExtractPanel />}
        </div>
      </div>
    </div>
  );
}
