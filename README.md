# 🕌 Qur'on Bot (Pro)

Modern, tezkor va foydali imkoniyatlarga boy muqaddas Qur'oni Karim Telegram boti. Ushbu loyiha orqali foydalanuvchilar Qur'on suralarini o'qishlari, ma'nolarini o'rganishlari va go'zal qiroatlarni tinglashlari mumkin.

## ✨ Asosiy Xususiyatlar

- 📖 **To'liq Qur'on:** Barcha 114 surani qulay navigatsiya (pagination) bilan ko'rish.
- 🇺🇿 **O'zbekcha Ma'nolari:** Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining mo'tabar tarjimalari.
- 🎧 **Go'zal Qiroatlar:** Mishari Rashid Alafasy tomonidan ijro etilgan oyatma-oyat audio qiroatlar.
- 🔍 **Aqlli Qidiruv:** Suralarni nomi (O'zbekcha/Inglizcha) yoki raqami bo'yicha tezkor topish.
- ⚡ **Inline Mode:** Istalgan chatda `@bot_username` orqali suralarni qidirish va ulashish.
- 🕌 **Oyatlar Oralig'i (Range):**
    - Tanlangan oraliqdagi matnlarni bir xabarda olish (Max: 20 oyat).
    - Tanlangan oraliqdagi audiolar playlistini olish (Max: 10 oyat).
- 🌟 **Loyihalarimiz:** Boshqa foydali islomiy botlarimizga tezkor o'tish tugmalari.
- ☁️ **Vercel Tayyor:** Serverless muhit (Vercel) uchun to'liq optimallashtirilgan.

## 🛠 Texnologiyalar

- **Framework:** [Grammy](https://grammy.dev/) (Telegram Bot Framework)
- **Runtime:** Node.js (TypeScript)
- **API:** [Al Quran Cloud API](https://alquran.cloud/api)
- **Frontend:** React (Landing Page uchun)
- **Deployment:** [Vercel](https://vercel.com/) / Express.js

## 🚀 O'rnatish va Ishga Tushirish

1.  **Loyihani ko'chiring:**
    ```bash
    git clone https://github.com/hayolnoma/quron-bot.git
    cd quron-bot
    ```

2.  **Kutubxonalarni o'rnating:**
    ```bash
    npm install
    ```

3.  **Muhit o'zgaruvchilarini sozlang:**
    `.env` faylini yarating va quyidagilarni kiriting:
    ```env
    TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
    NODE_ENV=development
    PORT=3000
    ```

4.  **Lokal rejimda ishga tushiring:**
    ```bash
    npm run dev
    ```

## 🌍 GitHub-ga yuklash

Loyihangizni GitHub-ga yuklash uchun quyidagi buyruqlarni bajaring:

```bash
git init
git add .
git commit -m "feat: premium start message and other projects added"
git branch -M main
git remote add origin https://github.com/USER_NAME/REPO_NAME.git
git push -u origin main
```

## 📄 Litsenziya

Ushbu loyiha ochiq manbali bo'lib, ta'lim va ma'naviy maqsadlarda foydalanish uchun mo'ljallangan.

---
🖋 **Dasturchi:** [@asking_robot](https://t.me/asking_robot)
