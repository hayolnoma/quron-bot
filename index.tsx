import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json() as any);

/**
 * PRODUCTION (Vercel) uchun webhook handler
 */

// Webhook mantiqi - /api/webhook va /bot ikkalasini ham qo'llab-quvvatlaydi
const handleUpdate = webhookCallback(bot, "express");

app.post("/api/webhook", handleUpdate);
app.post("/bot", handleUpdate);

// Asosiy sahifa
app.get("/", (req, res) => {
  res.status(200).send("🕌 Qur'on Bot is running perfectly on Vercel!");
});

// Bot holati haqida qisqacha ma'lumot
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    bot_token_set: !!process.env.TELEGRAM_BOT_TOKEN,
    node_env: process.env.NODE_ENV
  });
});

// Lokal rivojlantirish (Long Polling)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  (async () => {
    try {
      console.log("📡 Webhook tozalanmoqda (Lokal)...");
      await bot.api.deleteWebhook();

      console.log("🛠 Bot Long Polling rejimida ishga tushmoqda...");
      bot.start({
        onStart: (botInfo) => console.log(`✅ Bot @${botInfo.username} lokalda tayyor!`),
      });
    } catch (e) {
      console.error("❌ Lokal startda xatolik:", e);
    }
  })();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Lokal server: http://localhost:${PORT}`);
  });
}

export default app;