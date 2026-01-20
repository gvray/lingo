import { Hono } from "hono";
import { allTools } from "../../tools";

export const examplesToolsRoute = new Hono();

examplesToolsRoute.post("/", async (c) => {
  const { calculatorExpr, city, query } = await c.req.json();
  const results: Record<string, unknown> = {};
  if (calculatorExpr) {
    const calc = allTools.find((t) => t.name === "calculator");
    results.calculator = calc ? await calc.invoke({ expression: calculatorExpr }) : "calculator not found";
  }
  if (city) {
    const weather = allTools.find((t) => t.name === "get_weather");
    results.weather = weather ? await weather.invoke({ location: city }) : "get_weather not found";
  }
  if (query) {
    const search = allTools.find((t) => t.name === "search_web");
    results.search = search ? await search.invoke({ query }) : "search_web not found";
  }
  return c.json({ results });
});

