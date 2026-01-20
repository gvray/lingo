"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar, { AppMode } from "./components/Sidebar";
import ChatView from "./components/ChatView";
import SummaryPanel from "./components/SummaryPanel";
import TranslatePanel from "./components/TranslatePanel";
import ExtractPanel from "./components/ExtractPanel";
import AgentsDemo from "./components/examples/AgentsDemo";
import ModelsDemo from "./components/examples/ModelsDemo";
import MessagesDemo from "./components/examples/MessagesDemo";
import ToolsDemo from "./components/examples/ToolsDemo";
import MemoryDemo from "./components/examples/MemoryDemo";
import StreamingDemo from "./components/examples/StreamingDemo";
import StructuredDemo from "./components/examples/StructuredDemo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

function generateThreadId() {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMode, setActiveMode] = useState<AppMode>("chat");

  // 获取当前对话
  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages || [];

  // 创建新对话
  const handleNewChat = useCallback(() => {
    const newId = generateThreadId();
    const newConv: Conversation = {
      id: newId,
      title: "新对话",
      messages: [],
      createdAt: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
  }, []);

  // 初始化
  useEffect(() => {
    if (conversations.length === 0) {
      handleNewChat();
    }
  }, [conversations.length, handleNewChat]);

  // 选择对话
  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  // 删除对话
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/memory/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to clear memory:", e);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // 发送消息
  const handleSendMessage = async (content: string) => {
    if (!activeId || loading) return;

    const userMessage: Message = { role: "user", content };

    // 更新消息
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              title: c.messages.length === 0 ? content.slice(0, 30) : c.title,
            }
          : c,
      ),
    );

    setLoading(true);

    try {
      const currentMessages = [...messages, userMessage];
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          stream: true,
          threadId: activeId,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        // 添加空的 assistant 消息
        const assistantMessage: Message = { role: "assistant", content: "" };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c,
          ),
        );
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c;
            const newMessages = [...c.messages];
            const lastIdx = newMessages.length - 1;
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content: newMessages[lastIdx].content + text,
            };
            return { ...c, messages: newMessages };
          }),
        );
      }
    } catch (error) {
      console.error(error);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: "assistant", content: "发生错误，请重试" },
                ],
              }
            : c,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // 渲染主内容
  const renderMainContent = () => {
    switch (activeMode) {
      case "chat":
        return (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
          />
        );
      case "summary":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">文本摘要</h2>
            <SummaryPanel />
          </div>
        );
      case "translate":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">文本翻译</h2>
            <TranslatePanel />
          </div>
        );
      case "extract":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">信息提取</h2>
            <ExtractPanel />
          </div>
        );
      case "agents":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Agents 代理</h2>
            <AgentsDemo />
          </div>
        );
      case "models":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Models 模型</h2>
            <ModelsDemo />
          </div>
        );
      case "messages":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Messages 消息</h2>
            <MessagesDemo />
          </div>
        );
      case "tools":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tools 工具</h2>
            <ToolsDemo />
          </div>
        );
      case "memory":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">短期记忆</h2>
            <MemoryDemo />
          </div>
        );
      case "streaming":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">流式输出</h2>
            <StreamingDemo />
          </div>
        );
      case "structured":
        return (
          <div className="flex-1 flex flex-col bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">结构化输出</h2>
            <StructuredDemo />
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-zinc-950">
      <Sidebar
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
        }))}
        activeId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />
      {renderMainContent()}
    </div>
  );
}
