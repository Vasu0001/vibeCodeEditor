import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = Number(process.env.PORT ?? 3000);

app.get("/", (context) => {
  return context.html(`
    <main style="font-family: Inter, system-ui, sans-serif; padding: 32px;">
      <h1>Hono API Playground</h1>
      <p>Fast Web Standard APIs. Try <code>/api/health</code>.</p>
    </main>
  `);
});

app.get("/api/health", (context) => {
  return context.json({
    ok: true,
    stack: "hono",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/echo", async (context) => {
  const body = await context.req.json().catch(() => null);
  return context.json({ body });
});

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port
});

console.log(`Hono server running on WebContainer port ${port}`);
console.log("Use the VibeCode preview panel URL instead of host localhost.");
