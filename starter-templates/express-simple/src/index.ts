import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get("/", (_request, response) => {
  response.type("html").send(`
    <main style="font-family: Inter, system-ui, sans-serif; padding: 32px;">
      <h1>Express API Playground</h1>
      <p>Try <code>/api/health</code> or edit <code>src/index.ts</code>.</p>
    </main>
  `);
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    stack: "express",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/echo", (request, response) => {
  response.json({ body: request.body });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Express server running on WebContainer port ${port}`);
  console.log("Use the VibeCode preview panel URL instead of host localhost.");
});
