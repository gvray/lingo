import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

console.log("ENV loaded:", {
  MODEL: process.env.MODEL,
  BASE_URL: process.env.BASE_URL,
  API_KEY: process.env.API_KEY?.slice(0, 10) + "...",
});
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { chatRoute } from "./routes/chat";
import { summaryRoute } from "./routes/summary";
import { translateRoute } from "./routes/translate";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/chat", chatRoute);
app.route("/api/summary", summaryRoute);
app.route("/api/translate", translateRoute);

const port = parseInt(process.env.PORT || "3001");
serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Agents running at http://localhost:${port}`);
});
