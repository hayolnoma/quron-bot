import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Webhook POST so'rovlarini qabul qilish uchun json middleware
app.use(express.json() as any);

/**
 * Telegram Webhook endpoint
 * Koyeb yoki Vercel botga kelgan so'rovlarni shu manzilga yuboradi
 */
app.post("/api/webhook", webhookCallback(bot, "express"));

/**
 * Frontend xizmati (Landing Page)
 * Vite build jarayonida fayllarni 'dist/public' papkasiga joylaydi
 */
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath) as any);

// SPA routing - barcha boshqa so'rovlar uchun index.html ni qaytaradi
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT}-portda ishlamoqda`);
});