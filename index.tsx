
import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
// Fix for line 10: Use 'as any' to avoid 'No overload matches this call' error caused by internal Express type version conflicts
app.use(express.json() as any);

/**
 * Telegram Webhook endpoint
 * Bot tokeningiz xavfsizligi uchun maxfiy yo'l ishlatsangiz ham bo'ladi: /api/webhook/${process.env.TELEGRAM_BOT_TOKEN}
 */
app.post("/api/webhook", webhookCallback(bot, "express"));

// Asosiy sahifada bot holatini ko'rsatish (ixtiyoriy)
app.get("/", (req, res) => {
  res.status(200).send("Bot is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot server is running on port ${PORT}`);
  console.log(`📡 Webhook URL should be: https://YOUR_DOMAIN/api/webhook`);
});
