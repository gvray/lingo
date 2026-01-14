import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const searchWeb = tool(
  async ({ query }) => {
    // TODO: 接入真实搜索 API (如 SerpAPI, Tavily, Brave Search)
    return `搜索 "${query}" 的模拟结果:
1. ${query} - 维基百科
2. ${query} 最新资讯 - 新闻网站
3. ${query} 相关问答 - 问答社区

注: 这是模拟数据，需要接入真实搜索 API`;
  },
  {
    name: "search_web",
    description: "搜索网络获取信息（当前为模拟数据）",
    schema: z.object({
      query: z.string().describe("搜索关键词"),
    }),
  }
);
