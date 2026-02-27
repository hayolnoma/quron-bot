# 🕌 Qur'on Bot (Pro)

Modern, tezkor va funksional Qur'oni Karim Telegram boti. Ushbu bot orqali muqaddas Qur'on suralarini o'qishingiz, ma'nolarini o'rganishingiz va go'zal qiroatlarni tinglashingiz mumkin.

## ✨ Xususiyatlari

- 📖 **Suralar ro'yxati:** Barcha 114 surani qulay navigatsiya (pagination) bilan ko'rish.
- 🔍 **Aqlli Qidiruv:** Suralarni nomi (O'zbekcha yoki Inglizcha) va raqami bo'yicha tezkor topish.
- ⚡ **Inline Mode:** Istalgan chatingizda `@bot_username` orqali suralarni qidirish va ulashish.
- 🎧 **Oyatma-oyat qiroat:** Har bir oyatni alohida tinglash imkoniyati (Mishari Rashid Alafasy).
- 🇺🇿 **O'zbekcha Ma'nolari:** Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining tarjimalari.
- 🕌 **Oraliq so'rovlar (Range):**
    - Tanlangan oraliqdagi oyat matnlarini bitta xabarda olish (Max: 20 oyat).
    - Tanlangan oraliqdagi audio qiroatlarni playlist ko'rinishida olish (Max: 10 oyat).
- 🚀 **Kesh tizimi:** API so'rovlarni tejash va tezlikni oshirish uchun in-memory caching.
- ☁️ **Serverless:** Vercel platformasi uchun optimallashtirilgan.

## 🛠 Texnologiyalar

- **Framework:** [Grammy](https://grammy.dev/) (Telegram Bot Framework)
- **Runtime:** Node.js (TypeScript)
- **API:** [Al Quran Cloud API](https://alquran.cloud/api)
- **Deployment:** [Vercel](https://vercel.com/)
- **Server:** Express.js

## 🚀 Mahalliylashtirish (Local Setup)

1. Loyihani klonlang:
   ```bash
   git clone https://github.com/hayolnoma/quron-bot.git
   cd quron-bot
   ```

2. Kerakli kutubxonalarni o'rnating:
   ```bash
   npm install
   ```

3. `.env` faylini yarating va bot tokenini kiriting:
   ```env
   TELEGRAM_BOT_TOKEN=8699676681:AAHYoCG7eZ2CYMsdtf0Dt8yi9evFBe83Ygc
   NODE_ENV=development
   ```

4. Botni ishga tushiring:
   ```bash
   npm run dev
   ```

## 🌍 Vercel-ga yuklash (Deployment)

1. Vercel CLI-ni o'rnating yoki Dashboard orqali GitHub-ga bog'lang.
2. Vercel Dashboard-da `TELEGRAM_BOT_TOKEN` environment variable-ni qo'shing.
3. Webhook-ni sozlang:
   ```text
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/webhook
   ```

## 📄 Litsenziya

Ushbu loyiha ochiq manbali bo'lib, ta'lim va ma'naviy maqsadlarda foydalanish uchun mo'ljallangan.


---
🖋 **Dasturchi:** [hayolnoma](https://github.com/hayolnoma)
