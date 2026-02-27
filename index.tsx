import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json() as any);

/**
 * PRODUCTION (Vercel) uchun webhook handler
 * Vercel-da bot har bir so'rovda qayta ishga tushadi (serverless)
 */
const WEBHOOK_PATH = "/api/webhook";

// Vercel-da production muhitini tekshirish
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.post(WEBHOOK_PATH, webhookCallback(bot, "express"));
  console.log("🚀 Webhook handler registered for production.");
}

// Asosiy sahifa (Bot holatini tekshirish uchun)
app.get("/", (req, res) => {
  res.status(200).send("🕌 Qur'on Bot is running perfectly on Vercel!");
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