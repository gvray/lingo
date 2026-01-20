import  "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRoute } from "./routes/chat";
import { summaryRoute } from "./routes/summary";
import { translateRoute } from "./routes/translate";
import { memoryRoute } from "./routes/memory";
import { extractRoute } from "./routes/extract";
import { batchRoute } from "./routes/batch";
import { analyzeRoute } from "./routes/analyze";
import { examplesAgentsRoute } from "./routes/examples/agents";
import { examplesModelsRoute } from "./routes/examples/models";
import { examplesMessagesRoute } from "./routes/examples/messages";
import { examplesToolsRoute } from "./routes/examples/tools";
import { examplesMemoryRoute } from "./routes/examples/memory";
import { examplesStreamingRoute } from "./routes/examples/streaming";
import { examplesStructuredRoute } from "./routes/examples/structured";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:9527"],
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/chat", chatRoute);
app.route("/api/summary", summaryRoute);
app.route("/api/translate", translateRoute);
app.route("/api/memory", memoryRoute);
app.route("/api/extract", extractRoute);
app.route("/api/batch", batchRoute);
app.route("/api/analyze", analyzeRoute);
app.route("/api/examples/agents", examplesAgentsRoute);
app.route("/api/examples/models", examplesModelsRoute);
app.route("/api/examples/messages", examplesMessagesRoute);
app.route("/api/examples/tools", examplesToolsRoute);
app.route("/api/examples/memory", examplesMemoryRoute);
app.route("/api/examples/streaming", examplesStreamingRoute);
app.route("/api/examples/structured", examplesStructuredRoute);

const port = parseInt(process.env.PORT || "8081");
serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Agents running at http://localhost:${port}`);
});
