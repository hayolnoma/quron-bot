
import express from "express";
import { webhookCallback } from "grammy";
import * as dotenv from "dotenv";
import { bot } from "./bot";

dotenv.config();

const app = express();
app.use(express.json() as any);

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.WEBHOOK_URL;

app.get("/", (req: any, res: any) => {
  res.status(200).send({ 
    status: "active", 
    service: "Quran Bot Pro", 
    mode: process.env.NODE_ENV || "development" 
  });
});

if (process.env.NODE_ENV === "production") {
  if (!DOMAIN) {
    console.error("❌ WEBHOOK_URL (.env) kiritilmagan!");
    process.exit(1);
  }
  app.use("/webhook", webhookCallback(bot, "express") as any);
  app.listen(PORT, async () => {
    await bot.api.setWebhook(`${DOMAIN}/webhook`);
    console.log(`🚀 Bot PRODUCTION (Webhook) rejimida`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`🛠 Bot DEVELOPMENT (Polling) rejimida`);
    bot.start({ drop_pending_updates: true });
  });
}
