import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Webhook mantiqi - /api/webhook va /bot ikkalasini ham qo'llab-quvvatlaydi
const handleUpdate = webhookCallback(bot, "express");

app.post("/api/webhook", (req, res) => handleUpdate(req, res));
app.post("/bot", (req, res) => handleUpdate(req, res));

// Asosiy sahifa
app.get("/", (req, res) => {
  res.status(200).send(`🕌 Qur'on Bot is running! 
    <br> Bot: @${bot.botInfo?.username || "initialized"}
    <br> Token Status: ${process.env.TELEGRAM_BOT_TOKEN ? "✅ OK" : "❌ Missing"}`);
});

// Status end-point
app.get("/status", (req, res) => {
  res.status(200).json({
    status: "ok",
    token_set: !!process.env.TELEGRAM_BOT_TOKEN,
    node_env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Lokal rejim
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local: http://localhost:${PORT}`);
    bot.api.deleteWebhook().then(() => {
      bot.start({ onStart: (bi) => console.log(`✅ @${bi.username} started`) });
    });
  });
}

export default app;