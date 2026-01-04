import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";

const app = express();
app.use(express.json());

// Telegram webhook so'rovlarini qabul qilish
// Bu yo'l Vercel'dagi /api/webhook manziliga mos keladi
app.post("/api/webhook", webhookCallback(bot, "express"));

// Asosiy sahifa (ishlayotganini tekshirish uchun)
app.get("/", (req, res) => {
  res.status(200).send("Quran Bot is active and running on Vercel!");
});

// Vercel serverless muhitida ishlash uchun eksport
export default app;

// Mahalliy test qilish uchun (agar kerak bo'lsa)
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server locally running on http://localhost:${port}`);
  });
}