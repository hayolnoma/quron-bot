import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot.js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json() as any);

/**
 * Telegram Webhook endpoint
 */
app.post("/api/webhook", webhookCallback(bot, "express"));

/**
 * Static fayllarni xizmat qilish (Landing Page)
 * Builddan keyin static fayllar 'dist/client' yoki 'dist' ichida bo'lishi mumkin
 */
const publicPath = path.join(__dirname, "dist");
app.use(express.static(publicPath) as any);

// Barcha sahifalar uchun index.html (SPA xulq-atvori)
app.get("*", (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("Qur'on Bot is running. Landing page building...");
    }
  });
});

// Vercel uchun export (app ni listen qilmasdan)
export default app;

// Faqat lokalda ishlash uchun
if (process.env.NODE_ENV !== 'production') {
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Lokal server ishga tushdi: http://localhost:${PORT}`);
    console.log(`📡 Webhook: /api/webhook`);
  });
}