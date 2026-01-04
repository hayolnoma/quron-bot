import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";

const app = express();
app.use(express.json());

/**
 * Telegram webhook yo'li.
 * Vercel.json va Telegram setWebhook sozlamalarida ko'rsatilgan manzil.
 */
app.post("/api/webhook", webhookCallback(bot, "express"));

/**
 * Asosiy sahifa - bot holatini tekshirish uchun.
 */
app.get("/", (req, res) => {
  res.status(200).send("Qur'on Bot tizimi muvaffaqiyatli ishga tushirildi (Webhook faol)!");
});

export default app;

/**
 * Local muhitda test qilish uchun.
 */
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Lokal server: http://localhost:${port}`);
  });
}