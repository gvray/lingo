import  "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRoute } from "./routes/chat";
import { summaryRoute } from "./routes/summary";
import { translateRoute } from "./routes/translate";
import { memoryRoute } from "./routes/memory";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000"],
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/chat", chatRoute);
app.route("/api/summary", summaryRoute);
app.route("/api/translate", translateRoute);
app.route("/api/memory", memoryRoute);

const port = parseInt(process.env.PORT || "3001");
serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Agents running at http://localhost:${port}`);
});
