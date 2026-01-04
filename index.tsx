
import express from "express";
import { webhookCallback } from "grammy";
import * as dotenv from "dotenv";
import { bot } from "./bot";

dotenv.config();

const app = express();
app.use(express.json() as any);

const DOMAIN = process.env.WEBHOOK_URL;

app.get("/", (req: any, res: any) => {
  res.status(200).send({ 
    status: "active", 
    service: "Quran Bot Pro", 
    mode: process.env.NODE_ENV || "development" 
  });
});

// Vercel / Webhook marshruti
app.use("/webhook", webhookCallback(bot, "express") as any);

if (process.env.NODE_ENV === "production") {
  // Webhookni o'rnatish (Vercel-da har bir chaqiruvda emas, bir marta ishlashi uchun)
  if (DOMAIN) {
    bot.api.setWebhook(`${DOMAIN}/webhook`).catch(err => console.error("Webhook set error:", err));
  }
} else {
  // Local development uchun polling
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🛠 Bot DEVELOPMENT (Polling) rejimida port: ${PORT}`);
    bot.start({ drop_pending_updates: true });
  });
}

// Vercel uchun appni export qilish shart
export default app;
