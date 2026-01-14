import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";
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
 */
// Builddan keyin index.js 'dist' ichida bo'ladi, static fayllar 'dist/public'da
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath) as any);

// Barcha sahifalar uchun index.html (SPA xulq-atvori)
app.get("*", (req, res, next) => {
  // Agar API so'rovi bo'lmasa, index.html ni yuboramiz
  if (req.path.startsWith('/api')) return next();
  
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("Qur'on Bot is running. (Landing page building...)");
    }
  });
});

// Fix for line 41: Convert PORT to a number to satisfy the express.listen overload (port: number, hostname: string, callback)
const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});