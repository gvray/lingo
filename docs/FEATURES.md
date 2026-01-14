# Lingo 功能文档

## 项目架构

```
lingo/
├── apps/
│   ├── agents/          # Hono + LangChain 后端
│   │   ├── src/
│   │   │   ├── index.ts         # 入口
│   │   │   ├── lib/model.ts     # 模型配置
│   │   │   ├── routes/          # API 路由
│   │   │   ├── tools/           # LangChain Tools
│   │   │   ├── prompts/         # Prompt Templates
│   │   │   ├── memory/          # 短期记忆
│   │   │   └── middleware/      # 中间件
│   │   └── .env
│   └── web/             # Next.js 前端
└── docs/
```

---

## 1. Tools 工具系统

### 结构
每个工具独立文件，便于维护和测试。

```
tools/
├── index.ts          # 导出
├── calculator.ts     # 数学计算
├── current-time.ts   # 当前时间
├── weather.ts        # 天气查询 (Open-Meteo API)
└── search.ts         # 网络搜索
```

### 核心代码

**定义 Tool (`tools/calculator.ts`)**
```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculator = tool(
  async ({ expression }) => {
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
    const result = Function(`"use strict"; return (${sanitized})`)();
    return `${expression} = ${result}`;
  },
  {
    name: "calculator",
    description: "计算数学表达式，支持加减乘除、括号和取模运算",
    schema: z.object({
      expression: z.string().describe("数学表达式，如 '2 + 3 * 4'"),
    }),
  }
);
```

**天气工具 - 调用真实 API (`tools/weather.ts`)**
```typescript
export const getWeather = tool(
  async ({ location }) => {
    // 1. 地理编码
    const geo = await getCoordinates(location);
    // 2. 获取天气
    const weather = await getWeatherData(geo.latitude, geo.longitude);
    
    return `${geo.name}（${geo.country}）当前天气:
- 天气: ${weatherCodeMap[weather.current.weather_code]}
- 温度: ${weather.current.temperature_2m}°C
- 湿度: ${weather.current.relative_humidity_2m}%`;
  },
  {
    name: "get_weather",
    description: "获取指定城市的实时天气信息，支持全球城市",
    schema: z.object({
      location: z.string().describe("城市名称"),
    }),
  }
);
```

---

## 2. Tool Error Handling 错误处理

### 核心代码 (`middleware/tool-error-handler.ts`)

```typescript
export function createToolErrorHandler(options = {}) {
  const { maxRetries = 1, logErrors = true } = options;

  return async function handleToolCall(toolCall, toolFn) {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await toolFn(toolCall.args);
        return new ToolMessage({
          tool_call_id: toolCall.id,
          content: result,
        });
      } catch (error) {
        lastError = error;
        if (logErrors) {
          console.error(`[Tool Error] ${toolCall.name}:`, error.message);
        }
        // 重试延迟
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    // 返回错误信息给模型
    return new ToolMessage({
      tool_call_id: toolCall.id,
      content: `工具调用失败: ${toolCall.name}\n错误: ${lastError?.message}`,
    });
  };
}
```

---

## 3. Prompt Templates 提示词模板

### 结构

```
prompts/
├── index.ts
├── chat.ts       # ChatPromptTemplate + MessagesPlaceholder
├── summary.ts    # PromptTemplate
└── translate.ts  # FewShotPromptTemplate
```

### 核心代码

**Chat Prompt (`prompts/chat.ts`)**
```typescript
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

export const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", `你是一个智能助手，名叫 Lingo...`],
  new MessagesPlaceholder("history"),  // 历史消息占位
  ["human", "{input}"],
]);
```

**FewShot Prompt (`prompts/translate.ts`)**
```typescript
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

const examples = [
  { input: "Hello, how are you?", output: "你好，你好吗？" },
  { input: "今天天气真好", output: "The weather is really nice today" },
];

export const translateFewShotTemplate = new FewShotPromptTemplate({
  examples,
  examplePrompt: PromptTemplate.fromTemplate(`原文: {input}\n译文: {output}`),
  prefix: `你是一个专业翻译...`,
  suffix: `原文: {text}\n译文:`,
  inputVariables: ["target_lang", "text"],
});
```

---

## 4. Short-term Memory 短期记忆

使用官方 `@langchain/langgraph` 的 `MemorySaver` 实现。

### 结构

```text
memory/
├── index.ts
└── store.ts      # MemorySaver + MemoryStats
```

### 核心代码 (`memory/store.ts`)

```typescript
import { MemorySaver } from "@langchain/langgraph";

// 使用官方 MemorySaver 作为 checkpointer
export const checkpointer = new MemorySaver();

// 辅助统计
class MemoryStats {
  private threadIds = new Set<string>();

  track(threadId: string) {
    this.threadIds.add(threadId);
  }

  stats() {
    return { sessions: this.threadIds.size };
  }
}

export const memoryStats = new MemoryStats();
```

### 使用方式 (`routes/chat.ts`)

```typescript
import { createAgent } from "langchain";
import { checkpointer, memoryStats } from "../memory";

// 创建带 checkpointer 的 agent
const agent = createAgent({
  model: createModel(),
  tools: allTools,
  systemPrompt: SYSTEM_PROMPT,
  checkpointer,  // 官方 MemorySaver
});

chatRoute.post("/", async (c) => {
  const { messages, threadId } = await c.req.json();

  memoryStats.track(threadId);

  // 使用 thread_id 调用，自动记住上下文
  const result = await agent.invoke(
    { messages: [{ role: "user", content: userInput }] },
    { configurable: { thread_id: threadId } }
  );

  return c.json({ content: result.messages.at(-1)?.content });
});
```

### 关键点

| 特性 | 说明 |
| ---- | ---- |
| `MemorySaver` | 官方内存 checkpointer，自动管理对话状态 |
| `thread_id` | 在 `configurable` 中传入，标识会话 |
| 自动持久化 | Agent 自动保存和加载历史消息 |

---

## 5. API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/chat` | POST | 对话（支持 tools, threadId） |
| `/api/summary` | POST | 文本摘要 |
| `/api/translate` | POST | 翻译 |
| `/api/memory/stats` | GET | 内存统计 |
| `/api/memory/:threadId` | DELETE | 清除会话 |
| `/api/memory/cleanup` | POST | 清理过期会话 |

---

## 6. 环境配置

```env
# apps/agents/.env
PORT=3001
MODEL=qwen-turbo
API_KEY=sk-xxx
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```
