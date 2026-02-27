import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy';
import { SessionData } from './types.js';
import { Keyboards } from './keyboards.js';
import { quranService } from './quran-service.js';
import { SearchUtils } from './searching.js';
import * as dotenv from 'dotenv';

dotenv.config();

export type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn("⚠️ TELEGRAM_BOT_TOKEN isn't set!");
}

export const bot = new Bot<MyContext>(token || 'DUMMY_TOKEN_FOR_INITIALIZATION');

// Session sozlamalari
bot.use(session({
  initial: (): SessionData => ({
    language: 'uz',
  })
}));

// --- BUYRUQLAR ---

// --- CALLBACK HANDLERS ---

bot.callbackQuery('list_surahs', async (ctx) => {
  try {
    const surahs = await quranService.getSurahs();
    await ctx.editMessageText("📖 <b>Suralar ro'yxati:</b>\n\nQuyidan o'zingizga kerakli surani tanlang:", {
      parse_mode: 'HTML',
      reply_markup: Keyboards.surahList(surahs, 0)
    });
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Ma'lumot yuklashda xatolik.");
  }
});

bot.callbackQuery(/page_(\d+)/, async (ctx) => {
  try {
    const page = parseInt(ctx.match![1]);
    const surahs = await quranService.getSurahs();
    await ctx.editMessageText("📖 <b>Suralar ro'yxati:</b>", {
      parse_mode: 'HTML',
      reply_markup: Keyboards.surahList(surahs, page)
    });
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Sahifani yuklashda xatolik.");
  }
});

bot.callbackQuery('back_to_main', async (ctx) => {
  const welcomeText =
    `🏠 <b>Asosiy menyu</b>\n\n` +
    `Siz botimizning asosiy qismidasiz. Quyidagi tugmalar orqali kerakli bo'limga o'ting:`;

  await ctx.editMessageText(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: Keyboards.mainMenu()
  });
});

bot.callbackQuery('guide', async (ctx) => {
  const guideText =
    `<b>📚 Botdan foydalanish qo'llanmasi</b>\n\n` +
    `Botimizdan foydalanish juda oson va qulay. Quyida asosiy funksiyalar bilan tanishishingiz mumkin:\n\n` +
    `1️⃣ <b>Suralar ro'yxati:</b> Qur'ondagi barcha 114 ta surani topishingiz mumkin.\n\n` +
    `2️⃣ <b>🔍 Sura qidirish:</b> Sura nomi yoki raqami orqali tezkor qidirish imkoniyati.\n\n` +
    `3️⃣ <b>📖 Oyatma-oyat o'qish:</b> Surani tanlang va "Oyatma-oyat o'qish" tugmasini bosing.\n\n` +
    `4️⃣ <b>🕌 Arabcha matn:</b> Bir nechta oyatning arabcha matnini bitta xabarda olish (Max: 20 ta).\n\n` +
    `5️⃣ <b>🎧 Audio qiroat:</b> Har bir oyatni alohida yoki oraliqdagi oyatlar playlistini tinglash.\n\n` +
    `💡 <i>Maslahat: Menyu va Suralar ro'yxati orqali bot ichida osongina harakatlanishingiz mumkin.</i>`;

  await ctx.editMessageText(guideText, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text("🏠 Asosiy menyu", "back_to_main")
  });
});

bot.callbackQuery('about', async (ctx) => {
  const aboutText =
    `<b>✨ Qur'on Bot (Pro) — Ma'naviy hamrohingiz</b>\n\n` +
    `Ushbu bot muقدس Qur'onni o'rganishni xohlovchilar uchun maxsus ishlab chiqilgan.\n\n` +
    `<b>🔹 Manbalar va Mualliflar:</b>\n` +
    `• 📖 <b>Tarjimasi:</b> Shayx Muhammad Sodiq Muhammad Yusuf hazratlari.\n` +
    `• 🎙 <b>Qiroat:</b> Mishari Rashid Alafasy.\n` +
    `• 📡 <b>Texnologiya:</b> Al Quran Cloud API.\n\n` +
    `🚀 <i>Versiya: 1.3.0 (Premium)</i>`;

  await ctx.editMessageText(aboutText, {
    parse_mode: 'HTML',
    reply_markup: new InlineKeyboard().text("🏠 Asosiy menyu", "back_to_main")
  });
});

// --- QIDIRUV ---
bot.callbackQuery('search_surah', async (ctx) => {
  ctx.session.awaitingSearch = true;
  await ctx.editMessageText(
    "🔍 <b>Sura qidirish</b>\n\n" +
    "Sura raqamini (masalan: 1) yoki nomini (masalan: Fotiha) kiriting:",
    { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text("⬅️ Bekor qilish", "list_surahs") }
  );
});

bot.on('message:text', async (ctx, next) => {
  if (!ctx.session.awaitingSearch) return next();

  const query = ctx.message.text.trim();
  const surahs = await quranService.getSurahs();

  // Yangi mukammal qidiruv funksiyasidan foydalanamiz
  const results = SearchUtils.findSurahs(query, surahs);

  if (results.length === 0) {
    await ctx.reply(`😔 Kechirasiz, <b>"${query}"</b> bo'yicha hech qanday sura topilmadi.\n\nQayta urinib ko'ring yoki sura raqamini kiritib ko'ring:`, { parse_mode: 'HTML' });
    return;
  }

  ctx.session.awaitingSearch = false; // Qidiruv tugadi

  if (results.length === 1) {
    const s = results[0];
    const revelation = s.revelationType === 'Meccan' ? '🕋 Makkiy' : '🕌 Madaniy';
    const text = `🕋 <b>${s.number}. ${s.name} (${s.englishName})</b>\n` +
      `────────────────────\n` +
      `🔹 <b>Tarjimasi:</b> ${s.englishNameTranslation}\n` +
      `🔹 <b>Oyatlar soni:</b> ${s.numberOfAyahs} ta\n` +
      `🔹 <b>Nozil bo'lgan joyi:</b> ${revelation}\n\n` +
      `📜 <i>Sura haqida ma'lumot yuqorida keltirildi. O'qishni boshlash uchun quyidagi tugmani bosing:</i>`;

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: Keyboards.surahDetail(s.number) });
  } else {
    let text = `🔍 <b>"${ctx.message.text}" uchun topilgan suralar:</b>\n\n`;
    const keyboard = new InlineKeyboard();
    results.slice(0, 10).forEach((s, idx) => {
      keyboard.text(`${s.number}. ${s.englishName}`, `view_surah_${s.number}`);
      if (idx % 2 !== 0) keyboard.row();
    });
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard.row().text("⬅️ Bekor qilish", "list_surahs") });
  }
});

bot.callbackQuery(/range_ar_(\d+)/, async (ctx) => {
  try {
    const surahNum = parseInt(ctx.match![1]);
    ctx.session.currentSurahNum = surahNum;
    ctx.session.awaitingRange = true;
    ctx.session.awaitingAudioRange = false;

    const surah = await quranService.getSurahDetail(surahNum);

    await ctx.editMessageText(
      `🕌 <b>${surah.englishName} surasi</b>\n` +
      `🔢 Oyatlar soni: <b>${surah.numberOfAyahs}</b> ta\n\n` +
      `📝 <b>Arabcha matn</b> uchun oraliqni kiriting (masalan: <b>1-7</b>):\n\n` +
      `⚠️ <i>Maksimal 20 ta oyat yuboriladi.</i>`,
      { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text("⬅️ Bekor qilish", `view_surah_${surahNum}`) }
    );
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Ma'lumot yuklashda xatolik.");
  }
});

bot.callbackQuery(/range_audio_(\d+)/, async (ctx) => {
  try {
    const surahNum = parseInt(ctx.match![1]);
    ctx.session.currentSurahNum = surahNum;
    ctx.session.awaitingAudioRange = true;
    ctx.session.awaitingRange = false;

    const surah = await quranService.getSurahDetail(surahNum);

    await ctx.editMessageText(
      `🎧 <b>${surah.englishName} surasi (Audio)</b>\n` +
      `🔢 Oyatlar soni: <b>${surah.numberOfAyahs}</b> ta\n\n` +
      `🎵 <b>Audio qiroat</b> uchun oraliqni kiriting (masalan: <b>1-5</b>):\n\n` +
      `ℹ️ <i>Oyatlar birma-bir yuboriladi (Max: 10 ta).</i>`,
      { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text("⬅️ Bekor qilish", `view_surah_${surahNum}`) }
    );
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Ma'lumot yuklashda xatolik.");
  }
});

// Oyatlar oralig'ini qabul qilish (Matn va Audio uchun)
bot.on('message:text', async (ctx, next) => {
  const { awaitingRange, awaitingAudioRange, currentSurahNum } = ctx.session;
  if ((!awaitingRange && !awaitingAudioRange) || !currentSurahNum) return next();

  const rangePattern = /^(\d+)-(\d+)$/;
  const match = ctx.message.text.match(rangePattern);

  if (!match) {
    await ctx.reply("⚠️ Iltimos, formatni to'g'ri kiriting (masalan: <b>1-7</b>).", { parse_mode: 'HTML' });
    return;
  }

  const start = parseInt(match[1]);
  const end = parseInt(match[2]);
  const surahNum = currentSurahNum;

  if (start <= 0 || start > end) {
    await ctx.reply("⚠️ Oyat raqamlari noto'g'ri kiritildi.");
    return;
  }

  ctx.session.awaitingRange = false;
  ctx.session.awaitingAudioRange = false;
  ctx.session.currentSurahNum = undefined;

  if (awaitingRange) {
    let rangeEnd = end;
    if (end - start >= 20) {
      rangeEnd = start + 19;
      await ctx.reply(`⚠️ Xavfsizlik uchun maksimal 20 ta oyat ko'rsatiladi.`);
    }

    try {
      const waitMsg = await ctx.reply("⏳ Matn tayyorlanmoqda...");
      const surahData = await quranService.getSurahFull(surahNum);
      const finalEnd = Math.min(rangeEnd, surahData.numberOfAyahs);
      const selectedAyahs = surahData.ayahs.slice(start - 1, finalEnd);

      let resultText = `🕌 <b>${surahData.englishName} (${start}-${finalEnd})</b>\n\n`;
      selectedAyahs.forEach((ayah: any) => {
        resultText += `<b>${ayah.numberInSurah}.</b> ${ayah.text}\n\n`;
      });
      resultText += `────────────────────\n✨ <i>Mukammal bo'lgan Allohga hamdlar bo'lsin.</i>`;

      await ctx.api.deleteMessage(ctx.chat.id, waitMsg.message_id);
      await ctx.reply(resultText, { parse_mode: 'HTML', reply_markup: Keyboards.surahDetail(surahNum) });
    } catch (e) {
      await ctx.reply("❌ Ma'lumot yuklashda xatolik yuz berdi.");
    }
  }

  if (awaitingAudioRange) {
    let rangeEnd = end;
    const maxAudio = 10;
    if (end - start >= maxAudio) {
      rangeEnd = start + (maxAudio - 1);
      await ctx.reply(`⚠️ Telegram limitlari tufayli bir vaqtda ${maxAudio} ta audio yuboriladi.`);
    }

    try {
      const waitMsg = await ctx.reply(`⏳ Audiolar yuklanmoqda...`);
      const surah = await quranService.getSurahDetail(surahNum);

      const realEnd = Math.min(rangeEnd, surah.numberOfAyahs);
      for (let i = start; i <= realEnd; i++) {
        try {
          const audioUrl = await quranService.getAyahAudio(surahNum, i);
          await ctx.replyWithAudio(audioUrl, {
            title: `${surah.englishName}, ${i}-oyat`,
            performer: "Mishary Rashid Alafasy"
          });
        } catch { }
      }

      await ctx.api.deleteMessage(ctx.chat.id, waitMsg.message_id);
      await ctx.reply("✅ Audiolar yuborildi.", { reply_markup: Keyboards.surahDetail(surahNum) });
    } catch (e) {
      await ctx.reply("❌ Audio yuklashda xatolik yuz berdi.");
    }
  }
});

bot.callbackQuery(/view_surah_(\d+)/, async (ctx) => {
  try {
    ctx.session.awaitingRange = false;
    ctx.session.awaitingAudioRange = false;
    ctx.session.awaitingSearch = false;

    const surahNum = parseInt(ctx.match![1]);
    const surah = await quranService.getSurahDetail(surahNum);

    const revelation = surah.revelationType === 'Meccan' ? '🕋 Makkiy' : '🕌 Madaniy';

    const text = `🕋 <b>${surah.number}. ${surah.name} (${surah.englishName})</b>\n` +
      `────────────────────\n` +
      `🔹 <b>Tarjimasi:</b> ${surah.englishNameTranslation}\n` +
      `🔹 <b>Oyatlar soni:</b> ${surah.numberOfAyahs} ta\n` +
      `🔹 <b>Nozil bo'lgan joyi:</b> ${revelation}\n\n` +
      `📜 <i>Sura haqida ma'lumot yuqorida keltirildi. O'qishni boshlash uchun quyidagi tugmani bosing:</i>`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.surahDetail(surahNum)
    });
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Ma'lumot topilmadi.");
  }
});

bot.callbackQuery(/ayah_(\d+)_(\d+)/, async (ctx) => {
  const surahNum = parseInt(ctx.match![1]);
  const ayahNum = parseInt(ctx.match![2]);

  try {
    const [uzAyah, arAyah, surah] = await Promise.all([
      quranService.getAyah(surahNum, ayahNum, 'uz.sodik'),
      quranService.getAyah(surahNum, ayahNum, 'quran-simple'),
      quranService.getSurahDetail(surahNum)
    ]);

    const header = `📖 <b>${surah.number}. ${surah.englishName}, ${ayahNum}-oyat</b>\n` +
      `────────────────────\n`;
    const arabic = `<b>${arAyah.text}</b>\n\n`;
    const translation = `🇺🇿 <b>Ma'nosi:</b>\n<i>${uzAyah.text}</i>\n\n` +
      `────────────────────\n` +
      `<b>Tarjima:</b> Shaykh Muhammad Sodik Muhammad Yusuf\n` +
      `<b>Qiroat:</b> Mishary Rashid Alafasy`;

    await ctx.editMessageText(header + arabic + translation, {
      parse_mode: 'HTML',
      reply_markup: Keyboards.ayahNavigation(surahNum, ayahNum, surah.numberOfAyahs)
    });
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Ma'lumot topilmadi.");
  }
});

bot.callbackQuery(/audio_(\d+)_current_(\d+)/, async (ctx) => {
  const surahNum = parseInt(ctx.match![1]);
  const ayahNum = parseInt(ctx.match![2]);
  try {
    const audioUrl = await quranService.getAyahAudio(surahNum, ayahNum);
    await ctx.replyWithAudio(audioUrl, {
      title: `${ayahNum}-oyat`,
      performer: `Sura ${surahNum}`
    });
  } catch (e) {
    await ctx.answerCallbackQuery("⚠️ Audio topilmadi.");
  }
});

// --- INLINE QUERY ( @bot nomi ) ---
bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim();
  const surahs = await quranService.getSurahs();
  const results = SearchUtils.findSurahs(query || "1", surahs).slice(0, 50);

  const inlineResults = results.map((s) => ({
    type: 'article',
    id: `surah_${s.number}`,
    title: `${s.number}. ${s.englishName} (${s.name})`,
    description: `✨ ${s.englishNameTranslation} | ${s.numberOfAyahs} oyat`,
    input_message_content: {
      message_text: `🕋 <b>${s.number}. ${s.name} (${s.englishName})</b>\n` +
        `────────────────────\n` +
        `🔹 <b>Tarjimasi:</b> ${s.englishNameTranslation}\n` +
        `🔹 <b>Oyatlar soni:</b> ${s.numberOfAyahs} ta\n` +
        `🔹 <b>Nozil bo'lgan joyi:</b> ${s.revelationType === 'Meccan' ? '🕋 Makkiy' : '🕌 Madaniy'}\n\n` +
        `📖 Ushbu surani o'qish uchun botga kiring: @${ctx.me.username}`,
      parse_mode: 'HTML',
    },
    reply_markup: new InlineKeyboard().url("📖 Botda ochish", `https://t.me/${ctx.me.username}?start=surah_${s.number}`)
  }));

  await ctx.answerInlineQuery(inlineResults as any, { cache_time: 300 });
});

// Deep linking (start parameter) ni tekshirish
bot.command('start', async (ctx, next) => {
  const startParam = ctx.match;
  if (startParam && startParam.startsWith('surah_')) {
    const surahNum = parseInt(startParam.split('_')[1]);
    try {
      const surah = await quranService.getSurahDetail(surahNum);
      const revelation = surah.revelationType === 'Meccan' ? '🕋 Makkiy' : '🕌 Madaniy';
      const text = `🕋 <b>${surah.number}. ${surah.name} (${surah.englishName})</b>\n` +
        `────────────────────\n` +
        `🔹 <b>Tarjimasi:</b> ${surah.englishNameTranslation}\n` +
        `🔹 <b>Oyatlar soni:</b> ${surah.numberOfAyahs} ta\n` +
        `🔹 <b>Nozil bo'lgan joyi:</b> ${revelation}\n\n` +
        `📜 <i>Sura tanlandi. O'qishni boshlash uchun quyidagi tugmani bosing:</i>`;
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: Keyboards.surahDetail(surahNum) });
      return;
    } catch (e) { }
  }
  // Agar startParam bo'lmasa yoki xato bo'lsa, oddiy startni ishlatamiz
  // Buning uchun biz avvalgi command('start') ni o'rniga shu yerni to'liq yozamiz
  const welcomeText =
    `👋 <b>Assalomu alaykum, ${ctx.from?.first_name}!</b>\n\n` +
    `📖 <b>Qur'on Bot (Pro)</b>ga xush kelibsiz.\n\n` +
    `Ushbu bot orqali muقدس Qur'on suralarini o'qishingiz, ma'nolarini o'rganishingiz va qiroatlarni tinglashingiz mumkin.\n\n` +
    `👇 Davom etish uchun quyidagi menyundan foydalaning:`;

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: Keyboards.mainMenu()
  });
});

bot.catch((err) => {
  console.error("Bot Error:", err);
});
