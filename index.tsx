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
// Express json middleware
app.use(express.json() as any);

/**
 * Telegram Webhook endpoint
 */
app.post("/api/webhook", webhookCallback(bot, "express"));

/**
 * Static fayllarni xizmat qilish (Landing Page)
 * Vite 'dist/public' papkasiga build qiladi
 */
const publicPath = path.join(__dirname, "dist", "public");
app.use(express.static(publicPath) as any);

// Agar rootga kirsa va static topilmasa (yoki API bo'lmasa), landing sahifasini yuboramiz
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      // Agar build hali bo'lmagan bo'lsa, oddiy xabar
      res.status(200).send("Bot is running. (Landing page not built yet)");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
