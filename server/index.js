import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "30kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20 }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const { messages, subject = "General", mode = "explain" } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
    return res.status(400).json({ error: "Please send a valid conversation." });
  }
  const cleanMessages = messages
    .filter(m => ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 5000) }));
  if (!cleanMessages.length || cleanMessages.at(-1).role !== "user") {
    return res.status(400).json({ error: "Your message could not be read. Please try again." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI is not configured yet. Add OPENAI_API_KEY to the server .env file." });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const instruction = `You are AI Study Buddy, a kind, patient school tutor. Subject: ${String(subject).slice(0, 30)}. Mode: ${mode === "practice" ? "create practice questions" : "explain clearly"}.
Teach at a school-student level. Use simple language, short sections, and examples. For maths/science problems, show steps and explain why each step is used. Do not simply give unexplained answers. If the question is ambiguous, ask one concise clarification. For practice mode, create 5 questions from easy to challenging and put answers in a separate answer key at the end. Encourage learning without being judgmental.`;
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [{ role: "system", content: instruction }, ...cleanMessages],
      temperature: 0.5,
      max_tokens: 900
    });
    res.json({ reply: response.choices[0]?.message?.content || "I couldn't create an answer. Please try again." });
  } catch (error) {
    console.error("AI request failed:", error.message);
    res.status(500).json({ error: "The AI tutor is temporarily unavailable. Please try again in a moment." });
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), err => { if (err) next(); });
});

app.listen(port, () => console.log(`AI Study Buddy running on http://localhost:${port}`));