"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading: boolean;
}

export default function ChatView({ messages, onSendMessage, loading }: ChatViewProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Lingo AI</h1>
            <p className="text-zinc-500 text-center max-w-md">
              有什么可以帮助你的？我可以回答问题、帮你分析、翻译、总结等。
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-6 ${msg.role === "user" ? "" : ""}`}>
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === "user" 
                      ? "bg-blue-600" 
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                  }`}>
                    {msg.role === "user" ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-zinc-400 mb-1">
                      {msg.role === "user" ? "你" : "Lingo"}
                    </div>
                    <div className="text-zinc-100 leading-relaxed">
                      <pre className="whitespace-pre-wrap font-sans text-[15px]">{msg.content}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-zinc-400 mb-1">Lingo</div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end bg-zinc-800 rounded-2xl border border-zinc-700 focus-within:border-zinc-600 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="发送消息..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-zinc-500 px-4 py-3 text-[15px] resize-none outline-none max-h-[200px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="m-2 p-2 rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-600 text-center mt-2">
            Lingo 可能会出错，请核实重要信息。
          </p>
        </form>
      </div>
    </div>
  );
}
