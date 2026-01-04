
import express from "express";
import { webhookCallback } from "grammy";
import * as dotenv from "dotenv";
import { bot } from "./bot";

dotenv.config();

const app = express();
// Fixed: Cast express.json() to any to resolve 'NextHandleFunction' compatibility issues with app.use overloads
app.use(express.json() as any);

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.WEBHOOK_URL;

// Health check endpoint - Server holatini tekshirish uchun
/**
 * Fixed: Explicitly using express.Request and express.Response to avoid naming conflicts 
 * with the global DOM Response interface which does not contain the .status() method.
 */
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send({ status: "active", service: "Quran Bot Pro", mode: process.env.NODE_ENV });
});

/**
 * PRODUCTION: Webhook orqali ishlaydi
 * DEVELOPMENT: Long Polling orqali ishlaydi
 */
if (process.env.NODE_ENV === "production") {
  if (!DOMAIN) {
    console.error("❌ XATO: .env faylida WEBHOOK_URL ko'rsatilmagan!");
    process.exit(1);
  }

  // Fixed: Cast webhookCallback to any to bypass potential type mismatch with express middleware requirements
  app.use("/webhook", webhookCallback(bot, "express") as any);

  app.listen(PORT, async () => {
    try {
      await bot.api.setWebhook(`${DOMAIN}/webhook`);
      console.log(`🚀 Bot PRODUCTION rejimida ishga tushdi (Webhook)`);
      console.log(`📡 URL: ${DOMAIN}/webhook`);
    } catch (err) {
      console.error("❌ Webhook sozlashda xatolik:", err);
    }
  });
} else {
  // Local rejim
  app.listen(PORT, () => {
    console.log(`🛠 Bot DEVELOPMENT rejimida ishga tushdi (Polling)`);
    console.log(`📡 Server porti: ${PORT}`);
    
    bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Bot @${botInfo.username} sifatida muvaffaqiyatli ulandi.`);
      },
      drop_pending_updates: true // Bot o'chiq turgandagi eski xabarlarni tashlab yuboradi
    });
  });
}
