import express from "express";
import cors from "cors";

const app = express();

// Put your Vercel frontend domain here later (recommended)
// For now allow all origins while testing.
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running on port", PORT));
app.get("/", (req, res) => {
  res.send("Backend is running ✅ Try /api/health");
});

