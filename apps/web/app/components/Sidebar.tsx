"use client";

import { useState } from "react";

export type AppMode = "chat" | "summary" | "translate" | "extract";

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const appItems: { mode: AppMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "summary",
    label: "文本摘要",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    mode: "translate",
    label: "翻译助手",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    mode: "extract",
    label: "信息提取",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  collapsed = false,
  onToggle,
  activeMode,
  onModeChange,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [appsExpanded, setAppsExpanded] = useState(false);

  if (collapsed) {
    return (
      <div className="w-16 h-full bg-zinc-900 flex flex-col items-center py-4 border-r border-zinc-800">
        <button
          onClick={onToggle}
          className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mb-4"
          title="展开侧边栏"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => { onModeChange("chat"); onNewChat(); }}
          className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="新聊天"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-zinc-900 flex flex-col border-r border-zinc-800">
      {/* Header with Logo */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-white">Lingo</span>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div className="px-2 py-2 space-y-1">
        {/* New Chat */}
        <button
          onClick={() => { onModeChange("chat"); onNewChat(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm">新聊天</span>
        </button>

        {/* Apps Section */}
        <button
          onClick={() => setAppsExpanded(!appsExpanded)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
            activeMode !== "chat" ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm">应用</span>
          </div>
          <svg className={`w-4 h-4 transition-transform ${appsExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Apps List */}
        {appsExpanded && (
          <div className="ml-4 space-y-1">
            {appItems.map((app) => (
              <button
                key={app.mode}
                onClick={() => onModeChange(app.mode)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeMode === app.mode
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {app.icon}
                <span>{app.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-zinc-800" />

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <span className="text-xs text-zinc-500 font-medium">历史对话</span>
        </div>
        {conversations.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-4">暂无对话</p>
        ) : (
          <div className="px-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => { onModeChange("chat"); onSelect(conv.id); }}
                className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${
                  activeId === conv.id && activeMode === "chat"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-sm truncate">{conv.title}</span>
                </div>
                {hoveredId === conv.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span className="text-sm text-zinc-300">用户</span>
        </div>
      </div>
    </div>
  );
}
