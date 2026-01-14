import { webhookCallback } from "grammy";
import express from "express";
import { bot } from "./bot";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Telegram Webhook endpoint
app.post("/api/webhook", webhookCallback(bot, "express"));

/**
 * Vite build qilgan static fayllarni xizmat ko'rsatish (Landing Page)
 * Build jarayonida fayllar 'dist/public' papkasiga tushadi
 */
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Barcha boshqa so'rovlar uchun index.html ni qaytarish
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
