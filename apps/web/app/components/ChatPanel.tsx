"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// 生成唯一会话ID
function generateThreadId() {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化 threadId
  useEffect(() => {
    setThreadId(generateThreadId());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], stream: true, threadId }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: newMessages[newMessages.length - 1].content + text,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error occurred" }]);
    } finally {
      setLoading(false);
    }
  };

  // 新建对话
  const handleNewChat = async () => {
    if (threadId) {
      // 清除服务端内存
      try {
        await fetch(`${API_URL}/api/memory/${threadId}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to clear memory:", e);
      }
    }
    setMessages([]);
    setThreadId(generateThreadId());
  };

  return (
    <div className="flex h-[500px] flex-col">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-zinc-400">
          会话: {threadId.slice(0, 20)}...
        </span>
        <button
          onClick={handleNewChat}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          新对话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-zinc-400">开始对话...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
